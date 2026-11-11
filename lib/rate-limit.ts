// Fixed-window rate limiting kept in storage (Vercel Blob, or .data/ locally), because serverless memory doesn't
// survive between requests. Same approach as the admin's failed-login lockout (lib/auth.ts). The identifier
// (an IP address, an email) is stored only as a keyed SHA-256 hash, never in plain text.
import "server-only";
import { createHmac } from "node:crypto";
import { readJSON, writeJSON } from "./storage";

type Bucket = { hits: number[] };

function key(bucket: string, id: string): string {
  const secret = process.env.SESSION_SECRET || "mvs-rate-limit";
  const digest = createHmac("sha256", secret).update(`${bucket}:${id}`).digest("hex").slice(0, 40);
  return `ratelimit/${bucket}/${digest}.json`;
}

/** How many minutes until `id` may try again (0 = allowed now). Does not count an attempt. */
export async function blockedMinutes(bucket: string, id: string, limit: number, windowMs: number): Promise<number> {
  const now = Date.now();
  const data = await readJSON<Bucket>(key(bucket, id)).catch(() => null);
  const recent = (data?.hits ?? []).filter((t) => now - t < windowMs);
  if (recent.length < limit) return 0;
  return Math.max(1, Math.ceil((recent[0] + windowMs - now) / 60000));
}

/** Records one attempt for `id`. Returns the attempts counted in the current window. */
export async function recordHit(bucket: string, id: string, windowMs: number): Promise<number> {
  const now = Date.now();
  const path = key(bucket, id);
  const data = await readJSON<Bucket>(path).catch(() => null);
  const hits = [...(data?.hits ?? []).filter((t) => now - t < windowMs), now].slice(-50);
  await writeJSON(path, { hits });
  return hits.length;
}

/** Forgets the attempts for `id` (for example after a successful sign-in). */
export async function clearHits(bucket: string, id: string): Promise<void> {
  await writeJSON(key(bucket, id), { hits: [] });
}
