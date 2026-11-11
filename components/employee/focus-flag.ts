// A one-time note (sessionStorage) that says where keyboard focus should land after the page swaps between the
// sign-in form and the calendar: "in" after signing in (focus the heading), "out" after signing out (focus the
// password field). Only set by a submit, so an ordinary visit never has its focus moved. Storage can be blocked
// (private windows), so every access is guarded.
const KEY = "mvs-portal-focus";

export type FocusFlag = "in" | "out";

export function setFocusFlag(flag: FocusFlag): void {
  try {
    sessionStorage.setItem(KEY, flag);
  } catch {}
}

/** Returns the flag (if it matches) and clears it. */
export function takeFocusFlag(flag: FocusFlag): boolean {
  try {
    if (sessionStorage.getItem(KEY) !== flag) return false;
    sessionStorage.removeItem(KEY);
    return true;
  } catch {
    return false;
  }
}

export function clearFocusFlag(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch {}
}
