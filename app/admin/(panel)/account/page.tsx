import type { Metadata } from "next";
import { AccountForm } from "@/components/admin/AccountForm";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Your account" };

export default async function AccountPage() {
  const user = await requireUser();
  return (
    <>
      <header className="page-head">
        <h1>Your account</h1>
        <p className="lede-admin">
          You&apos;re signed in as {user.name} ({user.email}). Changing your password signs you out on your other devices.
        </p>
      </header>
      <AccountForm />
    </>
  );
}
