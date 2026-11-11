"use client";

// Contact form (Contact Us page). Same fields as the old site's form: Full Name*, Phone, Email*, Location*,
// Message. Checks the fields in the browser first (inline errors, focus on the first problem), then posts JSON
// to /api/contact, which checks everything again and emails the office. A hidden "company" field traps bots.
// Every word comes from the content via props: the field labels (content.contact.fields, the old site's form
// labels), the error/status lines (content.contact.messages) and the "Required" legend (content.labels.required).
import { useRef, useState, type FormEvent } from "react";
import type { SiteContent } from "@/lib/content-schema";
import { phoneHref } from "@/lib/format";
import { Icon } from "./Icon";

type LocationOption = { name: string; phone: string };

type Props = {
  locations: LocationOption[];
  /** content.contact.submitLabel ("Send") */
  submitLabel: string;
  /** content.header.mobileCallWord ("Call"): used on the call button shown when sending fails. */
  callWord: string;
  /** content.contact.fields: the field labels. */
  fields: SiteContent["contact"]["fields"];
  /** content.contact.messages: the error and status lines. */
  messages: Messages;
  /** content.labels.required ("Required"): the legend that explains the asterisk. */
  requiredLabel: string;
};

type Messages = SiteContent["contact"]["messages"];

type Field = "name" | "email" | "location";
type Errors = Partial<Record<Field, string>>;
type Status = { kind: "idle" | "sending" | "sent" | "error"; message: string };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ORDER: Field[] = ["name", "email", "location"];

function validate(data: Record<string, string>, names: string[], m: Messages): Errors {
  const errors: Errors = {};
  if (!data.name?.trim()) errors.name = m.nameMissing;
  if (!data.email?.trim()) errors.email = m.emailMissing;
  else if (!EMAIL.test(data.email.trim())) errors.email = m.emailInvalid;
  if (!data.location || !names.includes(data.location)) errors.location = m.locationMissing;
  return errors;
}

function formValues(form: HTMLFormElement): Record<string, string> {
  const out: Record<string, string> = {};
  new FormData(form).forEach((v, k) => {
    if (typeof v === "string") out[k] = v;
  });
  return out;
}

export function ContactForm({ locations, submitLabel, callWord, fields, messages, requiredLabel }: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<Status>({ kind: "idle", message: "" });
  // Phone to offer when sending fails: the chosen location's, or the first one's.
  const [callPhone, setCallPhone] = useState(locations[0]?.phone ?? "");
  const names = locations.map((l) => l.name);

  /** After a failed submit, fix errors as the visitor corrects each field. */
  function recheck(field: Field) {
    if (!errors[field] || !formRef.current) return;
    const next = validate(formValues(formRef.current), names, messages);
    setErrors((prev) => ({ ...prev, [field]: next[field] }));
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = formValues(form);
    const chosen = locations.find((l) => l.name === data.location);
    setCallPhone(chosen?.phone ?? locations[0]?.phone ?? "");

    const found = validate(data, names, messages);
    setErrors(found);
    const first = ORDER.find((f) => found[f]);
    if (first) {
      setStatus({ kind: "error", message: messages.fixErrors });
      form.querySelector<HTMLElement>(`#cf-${first}`)?.focus();
      return;
    }

    setStatus({ kind: "sending", message: messages.sending });
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const body = (await res.json().catch(() => ({}))) as { message?: string; errors?: Errors };
      if (res.ok) {
        form.reset();
        setErrors({});
        setStatus({ kind: "sent", message: body.message ?? messages.sent });
        return;
      }
      // The server found a problem with a field: show it next to that field.
      if (body.errors && Object.keys(body.errors).length) {
        setErrors(body.errors);
        const bad = ORDER.find((f) => body.errors?.[f]);
        if (bad) form.querySelector<HTMLElement>(`#cf-${bad}`)?.focus();
      }
      setStatus({ kind: "error", message: body.message ?? messages.failed });
    } catch {
      setStatus({ kind: "error", message: messages.offline });
    }
  }

  const sending = status.kind === "sending";
  /** Props that tie a field to its error message. */
  const errorProps = (f: Field) =>
    errors[f] ? { "aria-invalid": true as const, "aria-describedby": `cf-${f}-error` } : { "aria-invalid": false as const };
  const errorText = (f: Field) =>
    errors[f] ? (
      <p className="cf-error" id={`cf-${f}-error`}>
        {errors[f]}
      </p>
    ) : null;

  const req = (
    <span className="cf-req" aria-hidden="true">
      *
    </span>
  );

  return (
    <form ref={formRef} className="cf" onSubmit={onSubmit} noValidate>
      {/* Visible legend for the asterisk (screen readers also get the `required` attribute on each field). */}
      <p className="cf-note">
        <span className="cf-req" aria-hidden="true">
          *
        </span>{" "}
        {requiredLabel}
      </p>
      <div className="cf-row">
        <div className="cf-field">
          <label htmlFor="cf-name">
            {fields.name}
            {req}
          </label>
          <input
            id="cf-name"
            name="name"
            type="text"
            autoComplete="name"
            required
            maxLength={120}
            onChange={() => recheck("name")}
            {...errorProps("name")}
          />
          {errorText("name")}
        </div>
        <div className="cf-field">
          <label htmlFor="cf-phone">{fields.phone}</label>
          <input id="cf-phone" name="phone" type="tel" autoComplete="tel" inputMode="tel" maxLength={40} />
        </div>
      </div>

      <div className="cf-field">
        <label htmlFor="cf-email">
          {fields.email}
          {req}
        </label>
        <input
          id="cf-email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          maxLength={200}
          onChange={() => recheck("email")}
          {...errorProps("email")}
        />
        {errorText("email")}
      </div>

      <div className="cf-field">
        <label htmlFor="cf-location">
          {fields.location}
          {req}
        </label>
        <div className="cf-select">
          <select
            id="cf-location"
            name="location"
            required
            defaultValue=""
            onChange={() => recheck("location")}
            {...errorProps("location")}
          >
            <option value="">—</option>
            {locations.map((l) => (
              <option key={l.name} value={l.name}>
                {l.name}
              </option>
            ))}
          </select>
          <Icon name="chevronDown" size={18} className="cf-select-icon" />
        </div>
        {errorText("location")}
      </div>

      <div className="cf-field">
        <label htmlFor="cf-message">{fields.message}</label>
        <textarea id="cf-message" name="message" rows={6} maxLength={4000} />
      </div>

      {/* Spam trap: off-screen and skipped by keyboard and screen readers; bots tend to fill it in. */}
      <div className="cf-hp" aria-hidden="true">
        <label htmlFor="cf-company">Company</label>
        <input id="cf-company" name="company" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="cf-foot">
        <button className="btn btn-cta cf-submit" type="submit" disabled={sending}>
          {submitLabel}
          <Icon name="arrow" className="icon-arrow" />
        </button>
        <p className="cf-status" role="status" aria-live="polite" data-state={status.kind}>
          {status.kind === "sent" && <Icon name="check" />}
          {status.message}
        </p>
        {status.kind === "error" && !first(errors) && callPhone && (
          <a className="btn btn-ink cf-call" href={phoneHref(callPhone)}>
            <Icon name="phone" />
            {callWord} {callPhone}
          </a>
        )}
      </div>
    </form>
  );
}

/** First field with an error, if any (the call button only shows when the problem isn't a field). */
function first(errors: Errors): Field | undefined {
  return ORDER.find((f) => errors[f]);
}
