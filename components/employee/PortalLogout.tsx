"use client";

// Log out button for the Employee Portal. A form posting to the logout server action (works without JavaScript),
// plus, right after signing in, focus moves to the page heading so screen readers start at the top of the portal.
import { useEffect } from "react";
import { useFormStatus } from "react-dom";
import { logout } from "@/app/(site)/employee/actions";
import { setFocusFlag, takeFocusFlag } from "./focus-flag";

type Props = {
  /** content.employee.logoutLabel */
  label: string;
  /** id of the element to focus after signing in (the page's h1, which has tabIndex -1). */
  focusId: string;
};

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-line emp-logout" disabled={pending}>
      {label}
    </button>
  );
}

export function PortalLogout({ label, focusId }: Props) {
  useEffect(() => {
    if (takeFocusFlag("in")) document.getElementById(focusId)?.focus();
  }, [focusId]);

  return (
    <form className="emp-logout-form" action={logout} onSubmit={() => setFocusFlag("out")}>
      <Submit label={label} />
    </form>
  );
}
