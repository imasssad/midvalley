"use client";

// Contact form (Contact Us page). Same fields as the old site's form: Full Name*, Phone, Email*, Location*,
// Message. Checks the fields in the browser first (inline errors, focus on the first problem), then posts JSON
// to /api/contact, which checks everything again (422 + fieldErrors, shown next to each field), saves the message
// for the admin panel and emails the office. A hidden "company" field traps bots.
// - Failure: everything the visitor typed stays in the fields; the status line (live region) says what went wrong
//   and, unless the problem is a field, a call button offers the chosen location's number.
// - Success: the form fades out and a success panel fades and scales in, with a check that draws itself (two
//   strokes that grow with scaleX: transform and opacity only) and a "send another message" button that brings
//   back an empty form. Focus moves to the success line (read out by screen readers), then back to the first
//   field. With reduced motion: no scaling or drawing, only short fades.
// Every word comes from the content via props: the field labels (content.contact.fields, the old site's form
// labels), the error/status lines (content.contact.messages) and the "Required" legend (content.labels.required).
import { AnimatePresence, m, useReducedMotion } from "motion/react";
import { useCallback, useRef, useState, type FormEvent } from "react";
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
  /** The button on the success panel that brings back an empty form ("Send another message"). */
  sendAnotherLabel: string;
};

type Messages = SiteContent["contact"]["messages"];

type Field = "name" | "email" | "location";
type Errors = Partial<Record<Field, string>>;
type Status = { kind: "idle" | "sending" | "error"; message: string };

/** Same rule as the server (app/api/contact/route.ts). */
const EMAIL = /^[^\s@,;<>"']+@[^\s@,;<>"']+\.[^\s@,;<>"']+$/;
const ORDER: Field[] = ["name", "email", "location"];
const EASE = [0.22, 1, 0.36, 1] as const;
const IDLE: Status = { kind: "idle", message: "" };

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

/** Keeps only known field names with a message (the server's answer is not trusted blindly). */
function fieldErrorsFrom(value: unknown): Errors {
  if (typeof value !== "object" || value === null) return {};
  const src = value as Record<string, unknown>;
  const out: Errors = {};
  for (const f of ORDER) if (typeof src[f] === "string" && src[f]) out[f] = src[f] as string;
  return out;
}

export function ContactForm({
  locations,
  submitLabel,
  callWord,
  fields,
  messages,
  requiredLabel,
  sendAnotherLabel,
}: Props) {
  const reduce = useReducedMotion() ?? false;
  const formRef = useRef<HTMLFormElement | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<Status>(IDLE);
  /** The success line when the message went through (the form is swapped for the success panel). */
  const [sent, setSent] = useState<string | null>(null);
  /** The form's height when it was sent, so the success panel keeps the card the same size (no layout jump). */
  const [formHeight, setFormHeight] = useState(0);
  /** Set by "send another message": focus the first field once the empty form is back. */
  const focusFirstField = useRef(false);
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
    if (status.kind === "sending") return;
    const form = e.currentTarget;
    const data = formValues(form);
    const chosen = locations.find((l) => l.name === data.location);
    setCallPhone(chosen?.phone ?? locations[0]?.phone ?? "");

    const found = validate(data, names, messages);
    setErrors(found);
    const first = firstError(found);
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
      const body = (await res.json().catch(() => ({}))) as { ok?: boolean; message?: unknown; fieldErrors?: unknown };
      const text = typeof body.message === "string" && body.message ? body.message : null;
      if (res.ok && body.ok) {
        setFormHeight(form.offsetHeight);
        setErrors({});
        setStatus(IDLE);
        setSent(text ?? messages.sent);
        return;
      }
      // The server found a problem with a field: show it next to that field. Everything typed stays.
      const serverErrors = fieldErrorsFrom(body.fieldErrors);
      const bad = firstError(serverErrors);
      if (bad) {
        setErrors(serverErrors);
        form.querySelector<HTMLElement>(`#cf-${bad}`)?.focus();
      }
      setStatus({ kind: "error", message: text ?? messages.failed });
    } catch {
      setStatus({ kind: "error", message: messages.offline });
    }
  }

  function sendAnother() {
    focusFirstField.current = true;
    setSent(null);
  }

  /** Ref for the form: remembers it, and focuses the first field when it comes back after "send another". */
  const attachForm = useCallback((el: HTMLFormElement | null) => {
    formRef.current = el;
    if (el && focusFirstField.current) {
      focusFirstField.current = false;
      el.querySelector<HTMLElement>("#cf-name")?.focus();
    }
  }, []);

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

  const fade = { duration: reduce ? 0.15 : 0.25, ease: EASE };

  return (
    <div className="cf-stage">
      <AnimatePresence mode="wait" initial={false}>
        {sent === null ? (
          <m.form
            key="form"
            ref={attachForm}
            className="cf"
            onSubmit={onSubmit}
            noValidate
            aria-busy={sending}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.985 }}
            transition={fade}
          >
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
                {status.message}
              </p>
              {status.kind === "error" && !firstError(errors) && callPhone && (
                <a className="btn btn-ink cf-call" href={phoneHref(callPhone)}>
                  <Icon name="phone" />
                  {callWord} {callPhone}
                </a>
              )}
            </div>
          </m.form>
        ) : (
          <m.div
            key="sent"
            className="cf-done"
            style={formHeight ? { minHeight: formHeight } : undefined}
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
            transition={reduce ? fade : { duration: 0.5, ease: EASE }}
          >
            <m.span
              className="cf-done-badge"
              aria-hidden="true"
              initial={reduce ? false : { opacity: 0, scale: 0.4 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 320, damping: 18, delay: 0.12 }}
            >
              {/* The check draws itself: each stroke grows from its start (scaleX). */}
              <span className="cf-done-check">
                <span className="cf-done-stroke cf-done-stroke--short">
                  <m.span
                    initial={reduce ? false : { scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.2, ease: "easeIn", delay: 0.35 }}
                  />
                </span>
                <span className="cf-done-stroke cf-done-stroke--long">
                  <m.span
                    initial={reduce ? false : { scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.32, ease: EASE, delay: 0.55 }}
                  />
                </span>
              </span>
            </m.span>
            <p
              className="cf-done-text"
              tabIndex={-1}
              ref={focusOnMount}
            >
              {sent}
            </p>
            <m.div
              initial={reduce ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: EASE, delay: reduce ? 0 : 0.7 }}
            >
              <button className="btn btn-line cf-again" type="button" onClick={sendAnother}>
                {sendAnotherLabel}
              </button>
            </m.div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Moves focus to the success line when it appears, so screen readers read it out (stable: runs once). */
function focusOnMount(el: HTMLElement | null) {
  el?.focus();
}

/** First field with an error, if any (the call button only shows when the problem isn't a field). */
function firstError(errors: Errors): Field | undefined {
  return ORDER.find((f) => errors[f]);
}
