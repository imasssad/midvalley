// The visitor's IP address, for rate limiting only. On Vercel the platform sets x-forwarded-for (first entry is
// the client) and x-real-ip. Never logged or stored in plain text: lib/rate-limit.ts stores a keyed hash.
import "server-only";
import { headers } from "next/headers";

export async function clientIp(): Promise<string> {
  const h = await headers();
  const fwd = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  return fwd || h.get("x-real-ip")?.trim() || "unknown";
}
