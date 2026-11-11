// Employee Portal (/employee, same URL as the old site): a placeholder for now, kept out of search engines
// (noindex here, not in the sitemap; deliberately not blocked in app/robots.ts so crawlers can see the noindex).
// Phase 3 adds the server-side password gate (password in an env var) and the Google Calendar embed.
import type { Metadata } from "next";
import { Icon } from "@/components/Icon";
import { getSiteContent } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata("employee", "/employee", { noindex: true });
}

export default async function EmployeePage() {
  const { employee } = await getSiteContent();
  return (
    <div className="section section-cream emp">
      <div className="wrap">
        <div className="emp-card">
          <span className="emp-icon">
            <Icon name="key" size={28} />
          </span>
          <h1>{employee.heading}</h1>
          <p className="lede">{employee.placeholder}</p>
        </div>
      </div>
    </div>
  );
}
