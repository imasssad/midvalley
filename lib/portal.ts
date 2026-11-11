// Employee Portal (/employee): the shared password gate and the signed cookie that remembers a sign-in.
// Everything here runs on the server only: the password (EMPLOYEE_PORTAL_PASSWORD) and the calendar address
// (EMPLOYEE_CALENDAR_EMBED_URL) never reach the browser, and the calendar is only rendered after the cookie checks out.
//
// The cookie is an HS256 JWT (jose, same style as the admin session in lib/session-token.ts) signed with its own key,
// HMAC-SHA256(SESSION_SECRET, "employee-portal"), so a portal cookie can never pass as an admin session or the other
// way round. It carries a "pv" claim derived from the current password: changing EMPLOYEE_PORTAL_PASSWORD signs every
// device out.
import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { jwtVerify, SignJWT } from "jose";

export const PORTAL_COOKIE = "mvs_portal";
export const PORTAL_PATH = "/employee";
export const PORTAL_MAX_AGE = 12 * 60 * 60; // seconds

/** Failed attempts allowed per IP address in PORTAL_WINDOW_MS (lib/rate-limit.ts, bucket "portal"). */
export const PORTAL_BUCKET = "portal";
export const PORTAL_LIMIT = 5;
export const PORTAL_WINDOW_MS = 15 * 60 * 1000;

const ISSUER = "midvalleystorage.com";
const AUDIENCE = "employee-portal";
const CALENDAR_PREFIX = "https://calendar.google.com/";

type Config = { password: string; sessionSecret: string };

/** The password and signing secret, or null while the portal isn't set up (then the page shows the placeholder). */
function config(): Config | null {
  const password = process.env.EMPLOYEE_PORTAL_PASSWORD ?? "";
  const sessionSecret = process.env.SESSION_SECRET ?? "";
  // Same minimum as the admin session (lib/session-token.ts): a short secret makes the cookie guessable.
  if (!password || sessionSecret.length < 32) return null;
  return { password, sessionSecret };
}

/** True when EMPLOYEE_PORTAL_PASSWORD and SESSION_SECRET are both set. */
export function portalReady(): boolean {
  return config() !== null;
}

function signingKey(c: Config): Uint8Array {
  return new Uint8Array(createHmac("sha256", c.sessionSecret).update("employee-portal").digest());
}

/** Short keyed fingerprint of the current password (keyed, so the cookie can't be used to guess the password). */
function passwordVersion(c: Config): string {
  return createHmac("sha256", signingKey(c)).update(`pv:${c.password}`).digest("base64url").slice(0, 22);
}

const sha256 = (s: string) => createHash("sha256").update(s, "utf8").digest();

/** Constant-time check of a submitted password: both sides are hashed to 32 bytes, then compared with timingSafeEqual. */
export function passwordMatches(input: string): boolean {
  const c = config();
  if (!c) return false;
  return timingSafeEqual(sha256(input), sha256(c.password));
}

/** A fresh signed token for the portal cookie. */
export async function signPortalToken(): Promise<string> {
  const c = config();
  if (!c) throw new Error("The employee portal isn't set up (EMPLOYEE_PORTAL_PASSWORD and SESSION_SECRET).");
  return new SignJWT({ pv: passwordVersion(c) })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setSubject("employee")
    .setIssuedAt()
    .setExpirationTime(`${PORTAL_MAX_AGE}s`)
    .sign(signingKey(c));
}

async function verifyPortalToken(token: string | undefined): Promise<boolean> {
  const c = config();
  if (!c || !token) return false;
  try {
    const { payload } = await jwtVerify(token, signingKey(c), {
      algorithms: ["HS256"],
      issuer: ISSUER,
      audience: AUDIENCE,
      subject: "employee",
      maxTokenAge: `${PORTAL_MAX_AGE}s`,
      requiredClaims: ["iat", "exp"],
    });
    return typeof payload.pv === "string" && payload.pv === passwordVersion(c);
  } catch {
    return false;
  }
}

/** Whether this request carries a valid portal cookie. Reads cookies(), so it makes the caller request-time. */
export async function hasPortalAccess(): Promise<boolean> {
  const jar = await cookies();
  return verifyPortalToken(jar.get(PORTAL_COOKIE)?.value);
}

/** Cookie settings: httpOnly, HTTPS only, sent only to /employee, 12 hours. */
export const portalCookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "lax",
  path: PORTAL_PATH,
  maxAge: PORTAL_MAX_AGE,
} as const;

/** The Google Calendar embed address, only if it is a https://calendar.google.com/ address (else null). */
export function calendarEmbedUrl(): string | null {
  const raw = process.env.EMPLOYEE_CALENDAR_EMBED_URL?.trim();
  if (!raw || !raw.startsWith(CALENDAR_PREFIX)) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" || url.hostname !== "calendar.google.com" || url.username || url.password) return null;
    return url.toString();
  } catch {
    return null;
  }
}
