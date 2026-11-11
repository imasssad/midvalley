// POST /api/contact: the Contact Us form. Checks every field again on the server, then emails the office through
// Resend's HTTP API (same approach as rapidselfstorage, no extra package). Settings come from env vars:
//   CONTACT_TO_EMAIL    who gets the messages (comma-separated)
//   CONTACT_FROM_EMAIL  the sender, on a domain verified in Resend
//   RESEND_API_KEY      Resend API key
// Until all three are set, the form answers 503 and asks the visitor to call (stub behaviour for Phase 2); the form
// then shows a call button with the chosen location's number.
// The visitor-facing lines come from content.contact.messages; the field limits match the form's maxLength, so
// only clients that bypass the form can hit them and they get the general "didn't go through" line.
// Runs on Node.js (the default; the `runtime` segment option is not allowed with Cache Components).
// Privacy: the message body is never logged.
import { readContent } from "@/lib/content";

type Field = "name" | "email" | "location";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_BODY_BYTES = 20_000;

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

export async function POST(req: Request) {
  const content = await readContent();
  const m = content.contact.messages;
  const labels = content.contact.fields;

  if (Number(req.headers.get("content-length") ?? 0) > MAX_BODY_BYTES) {
    return Response.json({ message: m.failed }, { status: 413 });
  }

  let body: Record<string, unknown>;
  try {
    const parsed: unknown = await req.json();
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) throw new Error("not an object");
    body = parsed as Record<string, unknown>;
  } catch {
    return Response.json({ message: m.failed }, { status: 400 });
  }

  // Bots fill in the hidden field: pretend it worked and send nothing.
  if (str(body.company)) return Response.json({ ok: true, message: m.sent });

  // Names and subjects stay on one line.
  const name = str(body.name).replace(/\s+/g, " ");
  const email = str(body.email);
  const phone = str(body.phone).replace(/\s+/g, " ");
  const locationValue = str(body.location);
  const message = str(body.message);

  const location = content.locations.items.find((l) => l.name === locationValue);

  const errors: Partial<Record<Field, string>> = {};
  if (!name) errors.name = m.nameMissing;
  if (!email) errors.email = m.emailMissing;
  else if (!EMAIL.test(email)) errors.email = m.emailInvalid;
  if (!location) errors.location = m.locationMissing;
  if (Object.keys(errors).length) {
    return Response.json({ message: m.fixErrors, errors }, { status: 422 });
  }
  // Same limits as the form's maxLength attributes.
  if (name.length > 120 || email.length > 200 || phone.length > 40 || message.length > 4000) {
    return Response.json({ message: m.failed }, { status: 422 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.CONTACT_FROM_EMAIL;
  const to = (process.env.CONTACT_TO_EMAIL ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (!apiKey || !from || to.length === 0) {
    return Response.json({ message: m.failed }, { status: 503 });
  }

  const locationName = location!.name;
  const rows: [string, string][] = [
    [labels.name, name],
    [labels.email, email],
    [labels.phone, phone || "-"],
    [labels.location, locationName],
    [labels.message, message || "-"],
  ];
  const html = `<h2>New message from midvalleystorage.com</h2><table cellpadding="6">${rows
    .map(([k, v]) => `<tr><td valign="top"><strong>${k}</strong></td><td>${esc(v).replace(/\r?\n/g, "<br>")}</td></tr>`)
    .join("")}</table>`;
  const text = rows.map(([k, v]) => `${k}: ${v}`).join("\n");

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to,
        reply_to: email,
        subject: `Website message from ${name} (${locationName})`,
        html,
        text,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      // Log only Resend's error code, never what the visitor wrote.
      const err = (await res.json().catch(() => ({}))) as { name?: string };
      console.error("Contact form: Resend error", res.status, err.name ?? "");
      return Response.json({ message: m.failed }, { status: 502 });
    }
  } catch (err) {
    console.error("Contact form: couldn't reach Resend", err instanceof Error ? err.name : "");
    return Response.json({ message: m.failed }, { status: 502 });
  }

  return Response.json({ ok: true, message: m.sent });
}
