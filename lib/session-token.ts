// Signs and verifies the admin session cookie (HS256 JWT). Kept free of storage and next/headers so proxy.ts
// can use it for its quick check; every admin page, Server Action and route handler still re-checks the user in
// lib/auth.ts. Same design as rapidselfstorage.
import { jwtVerify, SignJWT } from "jose";

export const SESSION_COOKIE = "mvs_admin_session";
export const SESSION_MAX_AGE = 7 * 24 * 60 * 60; // seconds

/** Marks the token as an admin session, so no other signed cookie of this site can pass as one. */
const AUDIENCE = "mvs-admin";

export type Role = "owner" | "editor";
export type SessionClaims = { email: string; role: Role; sv: number };

function secret(): Uint8Array {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) throw new Error("SESSION_SECRET must be set to a random string of at least 32 characters.");
  return new TextEncoder().encode(s);
}

export async function signSession(claims: SessionClaims): Promise<string> {
  return new SignJWT({ role: claims.role, sv: claims.sv })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(claims.email)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(secret());
}

/** The claims of a valid, unexpired session token, or null (also null when SESSION_SECRET is missing). */
export async function verifySession(token: string | undefined): Promise<SessionClaims | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: ["HS256"], audience: AUDIENCE });
    if (typeof payload.sub !== "string" || (payload.role !== "owner" && payload.role !== "editor") || typeof payload.sv !== "number") {
      return null;
    }
    return { email: payload.sub, role: payload.role, sv: payload.sv };
  } catch {
    return null;
  }
}
