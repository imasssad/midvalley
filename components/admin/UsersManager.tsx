"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { addUser, removeUser, resetUserPassword, type ActionResult } from "@/app/admin/actions";

type Person = { email: string; name: string; role: "owner" | "editor" };

/** A readable random password, for handing over by phone or in person. */
function suggestPassword() {
  const words = "maple river stone cedar harbor meadow canyon willow summit orchard prairie lantern".split(" ");
  const pick = () => words[crypto.getRandomValues(new Uint32Array(1))[0] % words.length];
  return `${pick()}-${pick()}-${100 + (crypto.getRandomValues(new Uint32Array(1))[0] % 900)}`;
}

function Notice({ result }: { result: ActionResult | null }) {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => box.current?.scrollIntoView({ block: "nearest", behavior: "smooth" }), [result]);
  if (!result) return null;
  return (
    <div ref={box} className={result.ok ? "notice ok" : "notice error"} role="status">
      {result.ok ? result.message : result.error}
    </div>
  );
}

/** Shown after adding someone: everything they need to sign in, ready to pass on. */
function Handover({ person, onDone }: { person: { name: string; email: string; password: string }; onDone: () => void }) {
  const box = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const address = typeof location === "undefined" ? "/admin/login" : `${location.origin}/admin/login`;
  const text = `Sign in to edit the website at ${address}\nEmail: ${person.email}\nTemporary password: ${person.password}\nPlease change it under Your account after signing in.`;
  useEffect(() => box.current?.scrollIntoView({ block: "center", behavior: "smooth" }), []);
  return (
    <div ref={box} className="notice ok handover" role="status">
      <p>{person.name} can now sign in. Give them these details (the password isn&apos;t shown again):</p>
      <pre>{text}</pre>
      <p className="notice-actions">
        <button
          type="button"
          className="btn-admin secondary"
          onClick={() => navigator.clipboard?.writeText(text).then(() => setCopied(true), () => setCopied(false))}
        >
          {copied ? "Copied" : "Copy these details"}
        </button>
        <button type="button" className="link-btn" onClick={onDone}>
          Done
        </button>
      </p>
    </div>
  );
}

export function UsersManager({ people, me }: { people: Person[]; me: string }) {
  const router = useRouter();
  const [result, setResult] = useState<ActionResult | null>(null);
  const [form, setForm] = useState({ name: "", email: "", role: "editor", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [resetFor, setResetFor] = useState<string | null>(null);
  const [resetPw, setResetPw] = useState("");
  const [removing, setRemoving] = useState<string | null>(null);
  const [added, setAdded] = useState<{ name: string; email: string; password: string } | null>(null);
  const owners = people.filter((p) => p.role === "owner").length;

  async function run(fn: () => Promise<ActionResult>) {
    setBusy(true);
    const res = await fn();
    setBusy(false);
    setResult(res);
    if (res.ok) router.refresh();
    return res;
  }

  async function onAdd(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await addUser(form);
    setBusy(false);
    setErrors(!res.ok && res.fieldErrors ? res.fieldErrors : {});
    if (!res.ok) return setResult(res);
    setResult(null);
    setAdded({ name: form.name.trim(), email: form.email.trim().toLowerCase(), password: form.password });
    setForm({ name: "", email: "", role: "editor", password: "" });
    router.refresh();
  }

  return (
    <>
      <Notice result={result} />
      <ul className="people">
        {people.map((p) => (
          <li key={p.email}>
            <div className="person">
              <strong>{p.name}</strong>
              <span>{p.email}</span>
              <span className="role">{p.role === "owner" ? "Owner" : "Editor"}</span>
            </div>
            <div className="person-tools">
              {resetFor === p.email ? (
                <form
                  className="inline-form"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const res = await run(() => resetUserPassword(p.email, resetPw));
                    if (res.ok) {
                      setResetFor(null);
                      setResetPw("");
                    }
                  }}
                >
                  <label htmlFor={`pw-${p.email}`}>New temporary password</label>
                  <input id={`pw-${p.email}`} type="text" value={resetPw} onChange={(e) => setResetPw(e.target.value)} autoComplete="off" />
                  <button type="button" className="mini-btn" onClick={() => setResetPw(suggestPassword())}>
                    Suggest one
                  </button>
                  <button type="submit" className="mini-btn solid" disabled={busy}>
                    Set password
                  </button>
                  <button type="button" className="mini-btn" onClick={() => setResetFor(null)}>
                    Cancel
                  </button>
                </form>
              ) : removing === p.email ? (
                <span className="confirm">
                  <span>Remove {p.name}&apos;s access?</span>
                  <button type="button" className="mini-btn danger solid" disabled={busy} onClick={() => run(() => removeUser(p.email)).then(() => setRemoving(null))}>
                    Yes, remove
                  </button>
                  <button type="button" className="mini-btn" onClick={() => setRemoving(null)} autoFocus>
                    Cancel
                  </button>
                </span>
              ) : (
                <>
                  <button
                    type="button"
                    className="mini-btn"
                    onClick={() => {
                      setResetFor(p.email);
                      setResetPw("");
                    }}
                  >
                    Reset password
                  </button>
                  {p.email !== me && !(p.role === "owner" && owners === 1) && (
                    <button type="button" className="mini-btn danger" onClick={() => setRemoving(p.email)}>
                      Remove
                    </button>
                  )}
                </>
              )}
            </div>
          </li>
        ))}
      </ul>

      {added && (
        <Handover
          person={added}
          onDone={() => {
            setAdded(null);
            document.getElementById("new-name")?.focus();
          }}
        />
      )}
      <form className="group add-person" onSubmit={onAdd} noValidate>
        <h2>Add a person</h2>
        <p className="help">They sign in at this same address with their email and the temporary password you give them, then change it under Your account.</p>
        {(
          [
            ["name", "Name", "text"],
            ["email", "Email", "email"],
          ] as const
        ).map(([key, label, type]) => (
          <div className="field" key={key}>
            <label htmlFor={`new-${key}`}>{label}</label>
            <input
              id={`new-${key}`}
              type={type}
              autoComplete="off"
              value={form[key]}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              aria-invalid={errors[key] ? true : undefined}
            />
            {errors[key] && <p className="field-error">{errors[key]}</p>}
          </div>
        ))}
        {errors.role && <p className="field-error">{errors.role}</p>}
        <fieldset className="choices">
          <legend>What can they do?</legend>
          {(
            [
              ["editor", "Editor", "Can change everything on the website: the promo banner, text, photos, hours, phone numbers and links, and read messages. Can't add or remove people."],
              ["owner", "Owner", "Everything an editor can do, plus adding and removing people and resetting their passwords."],
            ] as const
          ).map(([value, title, text]) => (
            <label key={value} className="choice-card">
              <input type="radio" name="new-role" value={value} checked={form.role === value} onChange={() => setForm({ ...form, role: value })} />
              <span>
                <strong>{title}</strong>
                <span>{text}</span>
              </span>
            </label>
          ))}
        </fieldset>
        <div className="field">
          <label htmlFor="new-password">Temporary password</label>
          <p className="help">At least 10 characters.</p>
          <div className="input-row">
            <input
              id="new-password"
              type="text"
              autoComplete="off"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              aria-invalid={errors.password ? true : undefined}
            />
            <button type="button" className="mini-btn" onClick={() => setForm({ ...form, password: suggestPassword() })}>
              Suggest one
            </button>
          </div>
          {errors.password && <p className="field-error">{errors.password}</p>}
        </div>
        <button type="submit" className="btn-admin primary" disabled={busy}>
          {busy ? "Adding…" : "Add person"}
        </button>
      </form>
    </>
  );
}
