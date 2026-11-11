// 404 page. Uses the old site's own 404 words (content.notFound: "404", "page not found", "Go Home Page"), now
// linking to the real homepage (the old link pointed to http://home), plus each location's phone number so nobody
// is stuck. A plain not-found.js can't export metadata in this Next version: the title comes from the root
// layout's default (content.seo.notFound.title) and the description is a React 19 <meta>, hoisted into <head>.
// A poster: a huge condensed "404" on a hard blue offset, then the text, the home button and the phone links,
// rising in one after another with CSS (.enter-rise), so nothing waits for JavaScript.
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { getSiteContent } from "@/lib/content";
import { phoneHref } from "@/lib/format";

const order = (i: number) => ({ "--i": i }) as React.CSSProperties;

export default async function NotFound() {
  const { locations, header, notFound, seo } = await getSiteContent();
  return (
    <div className="section nf">
      <meta name="description" content={seo.notFound.description} />
      <div className="wrap nf-grid">
        <h1 className="nf-code enter-rise" style={order(0)}>
          {notFound.heading}
        </h1>
        <div className="nf-body">
          <p className="nf-text enter-rise" style={order(1)}>
            {notFound.text}
          </p>
          <span className="nf-home enter-rise" style={order(2)}>
            <Link className="btn btn-ink" href="/">
              {notFound.linkLabel}
              <Icon name="arrow" className="icon-arrow" />
            </Link>
          </span>
          <ul className="nf-phones">
            {locations.items.map((l, i) => (
              <li key={l.id} className="enter-rise" style={order(3 + i)}>
                <span className="nf-loc">{l.name}</span>
                <a href={phoneHref(l.phone)} className="link-draw nf-phone">
                  <Icon name="phone" />
                  {header.mobileCallWord} {l.phone}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
