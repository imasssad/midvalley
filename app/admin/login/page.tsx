import type { Metadata } from "next";
import { LoginForm } from "@/components/admin/LoginForm";
import { AdminIcon } from "@/components/admin/AdminIcon";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <div className="login admin-ui">
      <div className="login-brand">
        <div className="login-logo">
          {/* eslint-disable-next-line @next/next/no-img-element -- the site's SVG logo, shown as is */}
          <img src="/images/logo.svg" alt="Mid Valley Storage" width={166} height={96} />
        </div>
        <p className="login-brand-title" aria-hidden="true">
          Your website, in your hands.
        </p>
        <p className="login-brand-text" aria-hidden="true">
          Change the promo banner, hours, links, photos and text yourself. Save once and the website updates within seconds. Every save can be undone.
        </p>
      </div>
      <section className="login-panel" aria-labelledby="login-title">
        <div className="login-inner">
          <div className="login-head">
            <h1 id="login-title">Sign in</h1>
            <p>Sign in to edit the Mid Valley Storage website.</p>
          </div>
          <LoginForm />
          <p className="help login-help">Forgot your password? Ask an owner to reset it under People, or contact your developer.</p>
          <a className="login-back" href="/">
            <AdminIcon name="back" />
            Back to the website
          </a>
        </div>
      </section>
    </div>
  );
}
