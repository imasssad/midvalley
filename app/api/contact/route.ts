// POST /api/contact: the Contact Us form. Same approach as rapidselfstorage (Resend's HTTP API, no extra package),
// plus storage: every valid message is saved first (lib/messages.ts) so the office can read it in the admin panel
// (Messages) even when the email can't be sent.
//
// Flow:
//   1. Read the JSON body (max 20 KB). A filled-in hidden "company" field means a bot: answer "sent", do nothing.
//   2. Check every field again (the form checks them in the browser too). Problems: 422 { message, fieldErrors }
//      with one line per field, so the form can show each next to its field.
//   3. Rate limit (lib/rate-limit.ts, bucket "contact"): 5 valid submissions per hour per IP address (stored only
//      as a keyed hash). Over the limit: 429 with content.contact.messages.tooMany and a Retry-After header.
//   4. Save the message (saveMessage), then email the office through Resend with the location in the subject;
//      when the email goes out, the saved message is marked emailed (updateMessage).
//   5. Answer { ok: true, message: content.contact.messages.sent } when the message was saved or emailed (the
//      office sees saved messages in the admin panel even when email isn't set up or failed). Only when both
//      fail: 502 with content.contact.messages.failed (the form then shows a call button).
//
// Settings (env vars only, never in the repo):
//   CONTACT_TO_EMAIL    who gets the messages (comma-separated)
//   CONTACT_FROM_EMAIL  the sender, on a domain verified in Resend
//   RESEND_API_KEY      Resend API key
// Until all three are set, messages are only saved (admin panel → Messages).
//
// The visitor-facing lines come from content.contact.messages; the length limits match the form's maxLength, so
// only clients that bypass the form can hit them and they get the general "didn't go through" line.
// Runs on Node.js (the default; the `runtime` segment option is not allowed with Cache Components). POST route
// handlers are never cached.
// Privacy: nothing the visitor typed (name, email, phone, message) and no IP address is ever logged; logs carry only
// status codes and error names.
import { readContent } from "@/lib/content";
import { saveMessage, updateMessage, type ContactMessage } from "@/lib/messages";
import { blockedMinutes, recordHit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/request-ip";

type Field = "name" | "email" | "location";

/** Also rejects commas, semicolons, quotes and angle brackets, so the address can't smuggle in extra recipients. */
const EMAIL = /^[^\s@,;<>"']+@[^\s@,;<>"']+\.[^\s@,;<>"']+$/;
const MAX_BODY_BYTES = 20_000;
const LIMITS = { name: 120, email: 200, phone: 40, message: 4000 } as const;

const RATE_BUCKET = "contact";
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 60 * 60 * 1000;

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
// eslint-disable-next-line no-control-regex
const CONTROL = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g;
/** One line: no control characters or line breaks (names and phone numbers go into the subject and headers). */
const oneLine = (v: unknown) => str(v).replace(CONTROL, "").replace(/\s+/g, " ");
/** Several lines allowed (the message), control characters removed, Windows line endings normalised. */
const multiLine = (v: unknown) => str(v).replace(/\r\n?/g, "\n").replace(CONTROL, "");

const errorName = (err: unknown) => (err instanceof Error ? err.name : "unknown");

export async function POST(req: Request) {
  const content = await readContent();
  const m = content.contact.messages;
  const labels = content.contact.fields;

  if (Number(req.headers.get("content-length") ?? 0) > MAX_BODY_BYTES) {
    return Response.json({ message: m.failed }, { status: 413 });
  }

  let body: Record<string, unknown>;
  try {
    const raw = await req.text();
    if (raw.length > MAX_BODY_BYTES) throw new Error("too large");
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) throw new Error("not an object");
    body = parsed as Record<string, unknown>;
  } catch {
    return Response.json({ message: m.failed }, { status: 400 });
  }

  // Bots fill in the hidden field: pretend it worked, save and send nothing.
  if (str(body.company)) return Response.json({ ok: true, message: m.sent });

  const name = oneLine(body.name);
  const email = str(body.email);
  const phone = oneLine(body.phone);
  const message = multiLine(body.message);
  const location = content.locations.items.find((l) => l.name === str(body.location))?.name;

  const fieldErrors: Partial<Record<Field, string>> = {};
  if (!name) fieldErrors.name = m.nameMissing;
  if (!email) fieldErrors.email = m.emailMissing;
  else if (!EMAIL.test(email)) fieldErrors.email = m.emailInvalid;
  if (!location) fieldErrors.location = m.locationMissing;
  if (Object.keys(fieldErrors).length) {
    return Response.json({ message: m.fixErrors, fieldErrors }, { status: 422 });
  }
  // Same limits as the form's maxLength attributes.
  if (
    name.length > LIMITS.name ||
    email.length > LIMITS.email ||
    phone.length > LIMITS.phone ||
    message.length > LIMITS.message
  ) {
    return Response.json({ message: m.failed }, { status: 422 });
  }

  // Rate limit valid submissions only (a visitor fixing a typo isn't counted). If the store can't be reached the
  // message is still accepted: losing a customer is worse than one extra email.
  const ip = await clientIp();
  try {
    const wait = await blockedMinutes(RATE_BUCKET, ip, RATE_LIMIT, RATE_WINDOW_MS);
    if (wait > 0) {
      return Response.json(
        { message: m.tooMany },
        { status: 429, headers: { "Retry-After": String(wait * 60) } },
      );
    }
    await recordHit(RATE_BUCKET, ip, RATE_WINDOW_MS);
  } catch (err) {
    console.error("Contact form: rate limit check failed", errorName(err));
  }

  // 1. Save it, so the office sees it in the admin panel whatever happens to the email.
  let saved: ContactMessage | null = null;
  try {
    saved = await saveMessage({ name, phone, email, location: location!, message });
  } catch (err) {
    console.error("Contact form: couldn't save the message", errorName(err));
  }

  // 2. Email it.
  const emailed = await sendEmail({ name, email, phone, location: location!, message }, labels);
  if (emailed && saved) {
    await updateMessage(saved.id, { emailed: true }).catch((err) => {
      console.error("Contact form: couldn't mark the message as emailed", errorName(err));
    });
  }

  if (!saved && !emailed) return Response.json({ message: m.failed }, { status: 502 });
  return Response.json({ ok: true, message: m.sent });
}

type Submission = { name: string; email: string; phone: string; location: string; message: string };

/** Sends the message to CONTACT_TO_EMAIL through Resend. True when Resend accepted it. */
async function sendEmail(s: Submission, labels: Record<keyof Submission, string>): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.CONTACT_FROM_EMAIL;
  const to = (process.env.CONTACT_TO_EMAIL ?? "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
  if (!apiKey || !from || to.length === 0) {
    console.warn("Contact form: email isn't set up (RESEND_API_KEY, CONTACT_FROM_EMAIL, CONTACT_TO_EMAIL); message only saved.");
    return false;
  }

  const rows: [string, string][] = [
    [labels.name, s.name],
    [labels.email, s.email],
    [labels.phone, s.phone || "-"],
    [labels.location, s.location],
    [labels.message, s.message || "-"],
  ];
  const html = `<h2>New message from midvalleystorage.com</h2><table cellpadding="6">${rows
    .map(
      ([k, v]) =>
        `<tr><td valign="top"><strong>${esc(k)}</strong></td><td>${esc(v).replace(/\n/g, "<br>")}</td></tr>`,
    )
    .join("")}</table>`;
  const text = rows.map(([k, v]) => `${k}: ${v}`).join("\n");

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to,
        reply_to: s.email,
        subject: `Website message from ${s.name} (${s.location})`,
        html,
        text,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      // Log only Resend's status and error code, never what the visitor wrote.
      const err = (await res.json().catch(() => ({}))) as { name?: unknown };
      console.error("Contact form: Resend error", res.status, typeof err.name === "string" ? err.name : "");
      return false;
    }
    return true;
  } catch (err) {
    console.error("Contact form: couldn't reach Resend", errorName(err));
    return false;
  }
}
