"use client";

import { useState } from "react";
import { changeOwnPassword, type ActionResult } from "@/app/admin/actions";

export function AccountForm() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [again, setAgain] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ActionResult | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (next !== again) {
      setErrors({ again: "The two new passwords don't match." });
      return;
    }
    setBusy(true);
    const res = await changeOwnPassword(current, next);
    setBusy(false);
    setResult(res);
    setErrors(!res.ok && res.fieldErrors ? res.fieldErrors : {});
    if (res.ok) {
      setCurrent("");
      setNext("");
      setAgain("");
    }
  }

  const field = (id: string, label: string, value: string, set: (v: string) => void, auto: string, help?: string) => (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {help && <p className="help">{help}</p>}
      <input id={id} type="password" autoComplete={auto} value={value} onChange={(e) => set(e.target.value)} aria-invalid={errors[id] ? true : undefined} />
      {errors[id] && <p className="field-error">{errors[id]}</p>}
    </div>
  );

  return (
    <form className="group" onSubmit={onSubmit} noValidate>
      <h2>Change your password</h2>
      {result && (
        <div className={result.ok ? "notice ok" : "notice error"} role="status">
          {result.ok ? result.message : result.error}
        </div>
      )}
      {field("current", "Current password", current, setCurrent, "current-password")}
      {field("next", "New password", next, setNext, "new-password", "At least 10 characters. A short sentence is easy to remember and hard to guess.")}
      {field("again", "New password again", again, setAgain, "new-password")}
      <button type="submit" className="btn-admin primary" disabled={busy || !current || !next}>
        {busy ? "Saving…" : "Change password"}
      </button>
    </form>
  );
}
