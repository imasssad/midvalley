// 404 page. Uses the old site's own 404 words (content.notFound: "404", "page not found", "Go Home Page"), now
// linking to the real homepage (the old link pointed to http://home), plus each location's phone number so nobody
// is stuck. A plain not-found.js can't export metadata in this Next version: the title comes from the root
// layout's default (content.seo.notFound.title) and the description is a React 19 <meta>, hoisted into <head>.
// "Valley glass": a white-to-mist ground with a dot grid, soft glows and a blue-tint mountain ridge. Left: a huge
// condensed "404" in gradient text on a soft blue shadow, over a faint glossy ring. Right: a glossy card whose
// blue top band holds the text in white, then the home button and the phone numbers as glass chip links (location name above the
// number). Everything rises in one after another with CSS (.enter-rise), so nothing waits for JavaScript.
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { Ridge } from "@/components/Ridge";
import { getSiteContent } from "@/lib/content";
import { phoneHref } from "@/lib/format";

const order = (i: number) => ({ "--i": i }) as React.CSSProperties;

export default async function NotFound() {
  const { locations, header, notFound, seo } = await getSiteContent();
  return (
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
            <ul className="nf-phones">
              {locations.items.map((l, i) => (
                <li key={l.id} className="enter-rise" style={order(3 + i)}>
                  <a href={phoneHref(l.phone)} className="chip nf-chip">
                    <span className="chip-dot" aria-hidden="true">
                      <Icon name="phone" size={15} />
                    </span>
                    <span className="nf-chip-text">
                      <span className="nf-loc">{l.name}</span>
                      <span className="nf-phone">
                        {header.mobileCallWord} {l.phone}
                      </span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      <Ridge
        edge="bottom"
        fill="var(--mist-2)"
        height={90}
        className="pg-ridge nf-ridge"
      />
    </div>
  );
}
