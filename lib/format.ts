// Small display helpers shared by every page (and the admin panel in Phase 3).
import type { Location } from "./content-schema";
import { phoneDigits } from "./phone";

/** "tel:5597347368" */
export function phoneHref(phone: string): string {
  const d = phoneDigits(phone);
  return d ? `tel:${d}` : `tel:${phone.replace(/[^\d+]/g, "")}`;
}

/** "+1-559-734-7368" for structured data. */
export function phoneE164Dashed(phone: string): string | undefined {
  const d = phoneDigits(phone);
  return d ? `+1-${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}` : undefined;
}

/** One address format everywhere: "15323 E. Noble Ave., Visalia, CA 93292". */
export function formatAddress(a: Location["address"]): string {
  return `${a.street}, ${a.city}, ${a.state} ${a.zip}`;
}

/** Second line of a two-line address: "Visalia, CA 93292". */
export function cityLine(a: Location["address"]): string {
  return `${a.city}, ${a.state} ${a.zip}`;
}

/** "Mid Valley Storage © {year}" → "Mid Valley Storage © 2026". */
export function withYear(s: string, year = new Date().getFullYear()): string {
  return s.replace(/\{year\}/g, String(year));
}
