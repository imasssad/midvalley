// Small display helpers shared by every page (and the admin panel in Phase 3).
import type { Location, Specials } from "./content-schema";
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

// ---- Specials bar dates: whole days in California time (same rules as rapidselfstorage). ----

const TZ = "America/Los_Angeles";

/** How far California's wall clock is ahead of UTC at an instant, in ms (negative: it is behind). */
function tzOffsetMs(utcMs: number): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(utcMs));
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second")) - utcMs;
}

/** The instant (epoch ms) of midnight at the start of a YYYY-MM-DD day in California, plus `addDays` days. */
export function startOfDayLA(date: string, addDays = 0): number {
  const [y, m, d] = date.split("-").map(Number);
  const wall = Date.UTC(y, m - 1, d + addDays);
  const first = wall - tzOffsetMs(wall);
  return wall - tzOffsetMs(first); // second pass: right on the days the clocks change
}

/** When the bar may show: [from, until) in epoch ms. An empty date is no limit (±Infinity). The last day is included. */
export function specialsWindow(s: Pick<Specials, "startDate" | "endDate">): { from: number; until: number } {
  return {
    from: s.startDate ? startOfDayLA(s.startDate) : -Infinity,
    until: s.endDate ? startOfDayLA(s.endDate, 1) : Infinity,
  };
}

/** Whether the specials bar shows at this instant: switched on, has an offer, and inside its dates. */
export function specialsActive(s: Specials, now: number): boolean {
  if (!s.enabled || !s.text) return false;
  const { from, until } = specialsWindow(s);
  return now >= from && now < until;
}

/** "2026-12-01" → "Tuesday, December 1, 2026" (for the admin panel's notes). */
export function formatDay(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12)).toLocaleDateString("en-US", { timeZone: "UTC", weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

/** Why the specials bar isn't on the website at this instant, in the owner's words, or null while it shows. */
export function specialsHiddenReason(s: Specials, now: number): string | null {
  if (!s.enabled) return "The specials bar is switched off, so it isn't on the website.";
  if (!s.text) return "The specials bar is hidden because it has no offer.";
  const { from, until } = specialsWindow(s);
  if (now < from) return `The specials bar starts showing on ${formatDay(s.startDate)} (California time).`;
  if (now >= until) return `The specials bar's last day was ${formatDay(s.endDate)}, so it isn't on the website any more.`;
  return null;
}
