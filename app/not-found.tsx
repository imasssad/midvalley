// 404 page. Uses the old site's own 404 words (content.notFound: "404", "page not found", "Go Home Page"), now
// linking to the real homepage (the old link pointed to http://home), plus each location's phone number so nobody
// is stuck. A plain not-found.js can't export metadata in this Next version: the title comes from the root
// layout's default (content.seo.notFound.title) and the description is a React 19 <meta>, hoisted into <head>.
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { getSiteContent } from "@/lib/content";
import { phoneHref } from "@/lib/format";

export default async function NotFound() {
  const { locations, header, notFound, seo } = await getSiteContent();
  return (
    <div className="section nf">
      <meta name="description" content={seo.notFound.description} />
      <div className="wrap nf-inner">
        <h1 className="nf-code">{notFound.heading}</h1>
        <p className="nf-text">{notFound.text}</p>
        <Link className="btn btn-navy" href="/">
          {notFound.linkLabel}
          <Icon name="arrow" className="icon-arrow" />
        </Link>
        <ul className="nf-phones">
          {locations.items.map((l) => (
            <li key={l.id}>
              <span className="nf-loc">{l.name}</span>
              <a href={phoneHref(l.phone)} className="link-arrow">
                <Icon name="phone" />
                {header.mobileCallWord} {l.phone}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
