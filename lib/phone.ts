// Phone number helpers with no dependencies, so client components can use them without pulling in zod.
/** Digits of a US phone number, or null when it isn't one. */
export function phoneDigits(v: string): string | null {
  const d = v.replace(/\D/g, "");
  if (d.length === 10) return d;
  if (d.length === 11 && d.startsWith("1")) return d.slice(1);
  return null;
}
