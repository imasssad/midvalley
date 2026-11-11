// Employee Portal (/employee, same URL as the old site): a placeholder for now, kept out of search engines
// (noindex here, not in the sitemap; deliberately not blocked in app/robots.ts so crawlers can see the noindex).
// Phase 3 adds the server-side password gate (password in an env var) and the Google Calendar embed.
// A square card on sand; above the fold, so it rises in with CSS (.enter-rise) and its blue offset block slides out.
import type { Metadata } from "next";
import { Icon } from "@/components/Icon";
import { getSiteContent } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata("employee", "/employee", { noindex: true });
}

const order = (i: number) => ({ "--i": i }) as React.CSSProperties;

export default async function EmployeePage() {
  const { employee } = await getSiteContent();
  return (
    <div className="section bg-sand emp">
      <div className="wrap">
        <div className="emp-card card enter-rise" style={order(0)}>
          <span className="emp-icon enter-rise" style={order(1)}>
            <Icon name="key" size={28} />
          </span>
          <h1 className="enter-rise" style={order(2)}>
            {employee.heading}
          </h1>
          <p className="lede enter-rise" style={order(3)}>
            {employee.placeholder}
          </p>
        </div>
      </div>
    </div>
  );
}
