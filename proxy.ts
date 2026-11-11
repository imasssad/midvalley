// First line of defence for the admin panel: no valid session cookie, no admin page or admin API.
// This is only a quick signature check. Every admin page, Server Action and route handler checks the user again
// against the users file (lib/auth.ts), so a gap here never exposes anything on its own. Admin responses are
// never indexed and never cached.
import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "./lib/session-token";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = await verifySession(request.cookies.get(SESSION_COOKIE)?.value);
  const isLogin = pathname === "/admin/login";

  let response: NextResponse;
  if (isLogin && session) {
    response = NextResponse.redirect(new URL("/admin", request.url));
  } else if (!isLogin && !session) {
    response = pathname.startsWith("/api/")
      ? NextResponse.json({ error: "Sign in first." }, { status: 401 })
      : NextResponse.redirect(new URL("/admin/login", request.url));
    // A stale or forged cookie is dropped, so the browser stops sending it.
    if (request.cookies.has(SESSION_COOKIE)) response.cookies.delete(SESSION_COOKIE);
  } else {
    response = NextResponse.next();
  }
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export const config = {
  matcher: ["/admin", "/admin/:path*", "/api/admin/:path*"],
};
