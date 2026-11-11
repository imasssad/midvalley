// Employee Portal (/employee, same URL as the old site), kept out of search engines (noindex here, not in the
// sitemap; deliberately not blocked in app/robots.ts so crawlers can see the noindex).
// "Valley glass": a centred glossy card on a dotted mist ground with soft glows along the bottom. The card's glossy
// blue top band carries a round glossy key badge on its lower edge; below it the h1 in gradient text.
//
// Static shell + one request-time part (Cache Components): the card and heading come from the cached content and
// are prerendered; <PortalGate> reads the cookie, so it streams in behind <Suspense> on every request. It shows:
//   - the placeholder line while EMPLOYEE_PORTAL_PASSWORD / SESSION_SECRET aren't set (no form);
//   - the password form (components/employee/PortalLogin.tsx) without a valid cookie;
//   - the Google Calendar and a Log out button with one (the calendar URL only ever appears in that output).
// A response with a request-time part is sent with "Cache-Control: private, no-cache, no-store", so the signed-in
// page is never stored by a shared cache.
import type { Metadata } from "next";
import { Suspense } from "react";
import { Icon } from "@/components/Icon";
import { PortalLogin } from "@/components/employee/PortalLogin";
import { PortalLogout } from "@/components/employee/PortalLogout";
import { getSiteContent } from "@/lib/content";
import type { SiteContent } from "@/lib/content-schema";
import { calendarEmbedUrl, hasPortalAccess, portalReady } from "@/lib/portal";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata("employee", "/employee", { noindex: true });
}

const order = (i: number) => ({ "--i": i }) as React.CSSProperties;
const TITLE_ID = "emp-title";

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
          <span className="emp-icon enter-rise" style={order(1)} aria-hidden="true">
            <Icon name="key" size={28} />
          </span>
          <div className="emp-body">
            {/* tabIndex -1: focus lands here right after signing in (components/employee/PortalLogout.tsx). */}
            <h1 id={TITLE_ID} tabIndex={-1} className="grad-text enter-rise" style={order(2)}>
              {employee.heading}
            </h1>
            <Suspense fallback={<div className="emp-pending" aria-hidden="true" />}>
              <PortalGate employee={employee} />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}

/** The request-time part: reads the portal cookie and the environment, never cached. */
async function PortalGate({ employee }: { employee: SiteContent["employee"] }) {
  // Cookie first: it makes this component request-time, so the environment checks below are never baked into the
  // prerendered shell.
  const signedIn = await hasPortalAccess();

  if (!portalReady()) {
    return (
      <p className="lede emp-gate enter-rise" style={order(3)}>
        {employee.placeholder}
      </p>
    );
  }

  if (!signedIn) {
    return (
      <div className="emp-gate enter-rise" style={order(3)}>
        <PortalLogin passwordLabel={employee.passwordLabel} submitLabel={employee.submitLabel} />
      </div>
    );
  }

  const src = calendarEmbedUrl();
  return (
    <div className="emp-gate emp-portal enter-rise" style={order(3)}>
      {src ? (
        <div className="emp-cal">
          <iframe className="emp-cal-frame" src={src} title={employee.calendarTitle} loading="lazy" />
        </div>
      ) : (
        <p className="lede">{employee.placeholder}</p>
      )}
      <PortalLogout label={employee.logoutLabel} focusId={TITLE_ID} />
    </div>
  );
}
