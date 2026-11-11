// 404 page. Uses the old site's own 404 words (content.notFound: "404", "page not found", "Go Home Page"), now
// linking to the real homepage (the old link pointed to http://home), plus the header's actions so nobody is
// stuck: each location's payment link (content.header.paymentLabel + location name + street, opens the Storedge
// portal in a new tab) and each location's call button (content.header.mobileCallWord + short name + phone).
// A plain not-found.js can't export metadata in this Next version: the title comes from the root layout's default
// (content.seo.notFound.title) and the description is a React 19 <meta>, hoisted into <head>.
// "Valley glass": a white-to-mist ground with a dot grid, soft glows. Left: a huge condensed "404" in gradient
// text on a soft blue shadow, over a faint glossy ring. Right: a glossy card whose blue top band holds the text in
// white, then the home button, the payment links as glass chips (label above the location name and street) and
// the orange call buttons (.btn .btn-cta, as in the phone header). Everything rises in one after another with CSS
// (.enter-rise), so nothing waits for JavaScript. Styles: app/styles/pages.css (nf-).
// It renders outside the (site) route group, so it adds the site's header and footer itself (SiteChrome).
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { NewTabNote } from "@/components/NewTab";
import { SiteChrome } from "@/components/SiteChrome";
import { getSiteContent } from "@/lib/content";
import { phoneHref } from "@/lib/format";
import { externalLinkProps } from "@/lib/links";

const order = (i: number) => ({ "--i": i }) as React.CSSProperties;

export default async function NotFound() {
  const { locations, header, notFound, seo, labels } = await getSiteContent();
  const items = locations.items;
  return (
    <SiteChrome>
    <div className="section nf">
      <meta name="description" content={seo.notFound.description} />
      <div className="pg-decor" aria-hidden="true">
        <span className="dots nf-dots" />
        <span className="glow-blob nf-blob" />
        <span className="glow-blob nf-blob-2" />
      </div>
      <div className="wrap nf-grid">
        <div className="nf-code-wrap">
          <span className="nf-ring" aria-hidden="true" />
          <h1 className="nf-code grad-text enter-rise" style={order(0)}>
            {notFound.heading}
          </h1>
        </div>
        <div className="nf-body card">
          <div className="card-band nf-band">
            <p className="nf-text enter-rise" style={order(1)}>
              {notFound.text}
            </p>
          </div>
          <div className="nf-inner">
            <span className="nf-home enter-rise" style={order(2)}>
              <Link className="btn btn-ink" href="/">
                {notFound.linkLabel}
                <Icon name="arrow" className="icon-arrow" />
              </Link>
            </span>

            <div className="nf-actions">
              {/* Payment links (Storedge, new tab). The link text reads "Make a payment: Visalia Noble, 15323 E.
                  Noble Ave. (opens in a new tab)", so it makes sense on its own in a list of links. */}
              <ul className="nf-pay" role="list">
                {items.map((l, i) => {
                  const ext = externalLinkProps(l.paymentUrl);
                  return (
                    <li key={l.id} className="enter-rise" style={order(3 + i)}>
                      <a href={l.paymentUrl} className="chip nf-chip" {...ext}>
                        <span className="chip-dot" aria-hidden="true">
                          <Icon name="card" size={15} />
                        </span>
                        <span className="nf-chip-text">
                          <span className="nf-loc">
                            {header.paymentLabel}
                            <span className="sr-only">: </span>
                          </span>
                          <span className="nf-name">{l.name}</span>
                          <span className="sr-only">, </span>
                          <span className="nf-street">{l.address.street}</span>
                          {ext.target && <NewTabNote text={labels.newTab} />}
                        </span>
                      </a>
                    </li>
                  );
                })}
              </ul>

              {/* Call buttons, as in the phone header: "Call Noble (559) 734-7368". */}
              <ul className="nf-calls" role="list">
                {items.map((l, i) => (
                  <li key={l.id} className="enter-rise" style={order(3 + items.length + i)}>
                    <a href={phoneHref(l.phone)} className="btn btn-cta nf-call">
                      <Icon name="phone" size={18} />
                      <span>
                        {header.mobileCallWord} {l.shortName} <span className="nf-call-phone">{l.phone}</span>
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
    </SiteChrome>
  );
}
