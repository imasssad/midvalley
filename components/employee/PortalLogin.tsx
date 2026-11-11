"use client";

// Employee Portal sign-in form. Posts to the login server action (app/employee/actions.ts), so it works before
// JavaScript loads and without it; with JavaScript, useActionState keeps the page in place and shows the result.
// Every visible word comes from the content (props). Errors are announced (aria-live) and tied to the field
// (aria-describedby); after a failed try, focus returns to the password field with its text selected.
import { useActionState, useEffect, useRef } from "react";
import { login, type LoginState } from "@/app/(site)/employee/actions";
import { clearFocusFlag, setFocusFlag, takeFocusFlag } from "./focus-flag";

type Props = {
  /** content.employee.passwordLabel */
  passwordLabel: string;
  /** content.employee.submitLabel */
  submitLabel: string;
};

const initial: LoginState = { error: null, at: 0 };

export function PortalLogin({ passwordLabel, submitLabel }: Props) {
  const [state, action, pending] = useActionState(login, initial);
  const inputRef = useRef<HTMLInputElement>(null);

  // Just signed out: put focus on the password field.
  useEffect(() => {
    if (takeFocusFlag("out")) inputRef.current?.focus();
  }, []);

  // A failed try: back to the field, text selected, ready to retype.
  useEffect(() => {
    if (!state.error) return;
    clearFocusFlag();
    const input = inputRef.current;
    if (!input) return;
    input.focus();
    input.select();
  }, [state]);

  const hasError = Boolean(state.error);

  return (
    <form className="emp-form" action={action} onSubmit={() => setFocusFlag("in")} aria-busy={pending || undefined}>
      <div className="emp-field">
        <label htmlFor="emp-password">{passwordLabel}</label>
        <input
          ref={inputRef}
          id="emp-password"
          name="password"
          type="password"
          autoComplete="current-password"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          required
          maxLength={512}
          aria-invalid={hasError}
          aria-describedby={hasError ? "emp-error" : undefined}
        />
        {/* Always in the page, so screen readers announce the message when it appears. */}
        <p className="emp-error" id="emp-error" aria-live="polite" aria-atomic="true">
          {state.error}
        </p>
      </div>
      <button type="submit" className="btn btn-ink btn-block emp-submit" disabled={pending}>
        {submitLabel}
      </button>
    </form>
  );
}
