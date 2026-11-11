// Employee Portal (/employee, same URL as the old site): a placeholder for now, kept out of search engines
// (noindex here, not in the sitemap; deliberately not blocked in app/robots.ts so crawlers can see the noindex).
// Phase 3 adds the server-side password gate (password in an env var) and the Google Calendar embed.
// "Valley glass": a centred glossy card on a dotted mist ground with soft glows
// along the bottom. The card's glossy blue top band carries a round glossy key badge on its lower edge; below it the h1 in gradient
// text and the placeholder line. Above the fold, so everything rises in with CSS (.enter-rise), one after another,
// and the card's soft blue glow fades in.
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
      <div className="pg-decor" aria-hidden="true">
        <span className="dots emp-dots" />
        <span className="glow-blob emp-blob" />
        <span className="glow-blob emp-blob-2" />
      </div>
      <div className="wrap emp-wrap">
        <div className="emp-card card enter-rise" style={order(0)}>
          <div className="card-band emp-band" aria-hidden="true" />
          <span className="emp-icon enter-rise" style={order(1)}>
            <Icon name="key" size={28} />
          </span>
          <div className="emp-body">
            <h1 className="grad-text enter-rise" style={order(2)}>
              {employee.heading}
            </h1>
            <p className="lede enter-rise" style={order(3)}>
              {employee.placeholder}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
