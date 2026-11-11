// The visitor's IP address, for rate limiting only. Uses headers the hosting platform sets, not ones the visitor
// can make up: on Vercel x-vercel-forwarded-for (then x-real-ip). Otherwise the LAST x-forwarded-for entry, which
// the nearest proxy adds (the first entry is whatever the client sent). Never logged or stored in plain text:
// lib/rate-limit.ts stores a keyed hash.
import "server-only";
import { headers } from "next/headers";

export async function clientIp(): Promise<string> {
  const h = await headers();
  const vercel = h.get("x-vercel-forwarded-for")?.split(",")[0]?.trim();
  if (vercel) return vercel;
  const real = h.get("x-real-ip")?.trim();
  if (real) return real;
  const fwd = h.get("x-forwarded-for")?.split(",").map((s) => s.trim()).filter(Boolean);
  return fwd?.at(-1) || "unknown";
}
