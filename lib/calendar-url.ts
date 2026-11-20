// Turns the Google Calendar address the owner pastes (EMPLOYEE_CALENDAR_EMBED_URL) into an address that can be shown
// inside the Employee Portal. Google only allows its embed page in a frame, so the share links Google Calendar hands
// out are converted to it:
//   - an embed address: https://calendar.google.com/calendar/embed?src=…  (kept as it is)
//   - a share / "add this calendar" link: https://calendar.google.com/calendar/u/4?cid=<calendar id in base64>
//     or …/calendar/r?cid=<calendar id>  -> https://calendar.google.com/calendar/embed?src=<calendar id>
// Anything else (another host, http, a login inside the address, no calendar id) gives null, and the portal shows
// its "coming soon" note instead. Pure function (no server-only import) so it can be checked on its own.

const HOST = "calendar.google.com";
/** The time zone both locations are in, added when the address doesn't name one. */
const TIME_ZONE = "America/Los_Angeles";
/** A Google Calendar id: an email-like address (…@group.calendar.google.com, …@gmail.com, …). */
const CALENDAR_ID = /^[\w.+#-]+@[a-z0-9-]+(\.[a-z0-9-]+)+$/i; // "#" as in en.usa#holiday@group.v.calendar.google.com

/** `cid` values are either the calendar id itself or the id in (URL-safe) base64 without padding. */
function calendarIdFromCid(cid: string): string | null {
  const value = cid.trim();
  if (CALENDAR_ID.test(value)) return value;
  if (!/^[A-Za-z0-9_-]+={0,2}$/.test(value)) return null;
  const decoded = Buffer.from(value.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
  return CALENDAR_ID.test(decoded) ? decoded : null;
}

export function toCalendarEmbedUrl(raw: string | undefined | null): string | null {
  const value = raw?.trim();
  if (!value) return null;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" || url.hostname !== HOST || url.port || url.username || url.password) return null;

  // Already an embed address: keep every option the owner chose in Google (calendars, colours, views, time zone…).
  // The src values are passed on as they are: Google's "Customize" tool writes them in base64, and the host is
  // already pinned to calendar.google.com, so they can only ever pick calendars on Google's own embed page.
  if (/^\/calendar\/(?:[ub]\/\d+\/)?embed\/?$/.test(url.pathname)) {
    if (!url.searchParams.getAll("src").some((id) => id.trim())) return null;
    const embed = new URL(`https://${HOST}/calendar/embed`);
    url.searchParams.forEach((v, k) => embed.searchParams.append(k, v));
    if (!embed.searchParams.has("ctz")) embed.searchParams.set("ctz", TIME_ZONE);
    return embed.toString();
  }

  // A share link (…/calendar/u/4?cid=…, …/calendar/r?cid=…, or ?src=… on another calendar page).
  if (!url.pathname.startsWith("/calendar")) return null;
  const cid = url.searchParams.get("cid");
  const src = url.searchParams.get("src");
  const id = cid ? calendarIdFromCid(cid) : src && CALENDAR_ID.test(src) ? src : null;
  if (!id) return null;
  const embed = new URL(`https://${HOST}/calendar/embed`);
  embed.searchParams.set("src", id);
  embed.searchParams.set("ctz", TIME_ZONE);
  return embed.toString();
}
