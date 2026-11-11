import type { Metadata } from "next";
import "./admin.css";

// The admin panel ("Website editor"). It shares only the document shell (app/layout.tsx) with the public site: no
// public header, footer, structured data or Google Tag Manager. Never indexed (proxy.ts also sends X-Robots-Tag: noindex and Cache-Control: no-store).
export const metadata: Metadata = {
  title: { default: "Website editor", template: "%s · Website editor" },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="admin-root">{children}</div>;
}
