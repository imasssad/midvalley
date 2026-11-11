"use server";

// Employee Portal sign-in and sign-out (server actions, so they also work without JavaScript).
// The password check, the rate limit and the cookie all happen here on the server; the browser only ever gets
// an httpOnly cookie and, on failure, one of the content's messages.
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSiteContent } from "@/lib/content";
import {
  PORTAL_BUCKET,
  PORTAL_COOKIE,
  PORTAL_LIMIT,
  PORTAL_PATH,
  PORTAL_WINDOW_MS,
  passwordMatches,
  portalCookieOptions,
  portalReady,
  signPortalToken,
} from "@/lib/portal";
import { blockedMinutes, clearHits, recordHit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/request-ip";

export type LoginState = {
  /** The message to show (content.employee.wrongPassword / tooManyTries / placeholder), or null. */
  error: string | null;
  /** Changes on every failed attempt, so the form re-focuses the field even when the message is the same. */
  at: number;
};

const fillMinutes = (template: string, minutes: number) => template.replaceAll("{minutes}", String(minutes));

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const { employee } = await getSiteContent();
  const fail = (error: string): LoginState => ({ error, at: Date.now() });

  if (!portalReady()) return fail(employee.placeholder);

  const ip = await clientIp();
  const wait = await blockedMinutes(PORTAL_BUCKET, ip, PORTAL_LIMIT, PORTAL_WINDOW_MS);
  if (wait > 0) return fail(fillMinutes(employee.tooManyTries, wait));

  const raw = formData.get("password");
  // Capped so a huge post can't make the hash expensive; real passwords are far shorter.
  const password = typeof raw === "string" ? raw.slice(0, 512) : "";

  if (!password || !passwordMatches(password)) {
    if (password) {
      try {
        const hits = await recordHit(PORTAL_BUCKET, ip, PORTAL_WINDOW_MS);
        if (hits >= PORTAL_LIMIT) {
          const minutes = await blockedMinutes(PORTAL_BUCKET, ip, PORTAL_LIMIT, PORTAL_WINDOW_MS);
          return fail(fillMinutes(employee.tooManyTries, Math.max(1, minutes)));
        }
      } catch (err) {
        // Storage hiccup: still refuse the password, just without counting it.
        console.error("Couldn't record a failed employee portal sign-in.", err);
      }
    }
    return fail(employee.wrongPassword);
  }

  try {
    await clearHits(PORTAL_BUCKET, ip);
  } catch (err) {
    console.error("Couldn't clear the employee portal sign-in attempts.", err);
  }
  const jar = await cookies();
  jar.set(PORTAL_COOKIE, await signPortalToken(), portalCookieOptions);
  // Post/redirect/get: a reload never re-posts the password, and without JavaScript the browser lands on the calendar.
  redirect(PORTAL_PATH);
}

export async function logout(): Promise<void> {
  const jar = await cookies();
  // Same name and path as when it was set, so the browser drops it.
  jar.delete({ name: PORTAL_COOKIE, path: PORTAL_PATH, httpOnly: true, secure: true, sameSite: "lax" });
  redirect(PORTAL_PATH);
}
