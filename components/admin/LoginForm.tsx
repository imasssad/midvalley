"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { login } from "@/app/admin/actions";
import { AdminIcon } from "./AdminIcon";

export function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined);
  const [showPassword, setShowPassword] = useState(false);
  const email = useRef<HTMLInputElement>(null);
  const password = useRef<HTMLInputElement>(null);
  // Each answer from the server is a new object: count them, so a repeated error message is shown (and announced)
  // again when it arrives, not when the button is pressed.
  const [seen, setSeen] = useState(state);
  const [answer, setAnswer] = useState(0);
  if (state !== seen) {
    setSeen(state);
    setAnswer((n) => n + 1);
  }

  // After an error, put the cursor back in the form: the password, or the email if that's empty.
  useEffect(() => {
    if (state?.error) (email.current?.value ? password.current : email.current)?.focus();
  }, [state]);

  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (pending) e.preventDefault();
        else setShowPassword(false);
      }}
      className="login-form"
    >
      {state?.error && (
        <div key={answer} className="notice error login-error" role="alert">
          {state.error}
        </div>
      )}
      <div className="field">
        <label htmlFor="email">Email</label>
        <div className="input-icon">
          <AdminIcon name="mail" />
          <input ref={email} id="email" name="email" type="email" autoComplete="username" autoFocus required defaultValue={state?.email} />
        </div>
      </div>
      <div className="field">
        <label htmlFor="password">Password</label>
        <div className="input-icon">
          <AdminIcon name="lock" />
          <input ref={password} id="password" name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" required />
          <button
            type="button"
            className="pw-reveal"
            onClick={() => setShowPassword((v) => !v)}
            aria-controls="password"
            aria-pressed={showPassword}
            aria-label="Show password"
          >
            <AdminIcon name={showPassword ? "eyeOff" : "eye"} />
          </button>
        </div>
      </div>
      {/* aria-disabled rather than disabled, so keyboard focus stays on the button while signing in. */}
      <button type="submit" className="btn-admin primary wide login-submit" aria-disabled={pending}>
        {pending ? (
          <>
            <span className="a-spinner" aria-hidden="true" />
            Signing in…
          </>
        ) : (
          <>
            Sign in
            <AdminIcon name="arrow" />
          </>
        )}
      </button>
    </form>
  );
}
