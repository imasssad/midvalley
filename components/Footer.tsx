// Site footer (navy): logo and Contact button, the page links (on phones these are the main navigation, so they
// come right after the logo), Instagram and the Employee Portal link, both locations with address, phone and
// hours, a small photo grid, and the copyright line. Server component.
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import type { SiteContent } from "@/lib/content-schema";
import { cityLine, phoneHref, withYear } from "@/lib/format";
import { externalLinkProps } from "@/lib/links";
import { Icon } from "./Icon";
import { NavLinks, NavLinksStatic } from "./NavLinks";
import { NewTabNote } from "./NewTab";
import { Photo } from "./Photo";

export function Footer({ content, year }: { content: SiteContent; year: number }) {
  const { business, footer, nav, labels } = content;
  const locations = content.locations.items;

  return (
    <footer className="site-footer on-navy">
      <div className="wrap-wide ft-grid">
        {/* Logo on a white tile, so the real two-colour logo stays crisp on navy. */}
        <div className="ft-brand">
          <Link href="/" className="ft-logo">
            <Image src={business.logo.src} alt={business.logo.alt || business.name} width={166} height={96} unoptimized />
          </Link>
          <Link href="/contact" className="btn btn-orange ft-contact">
            <Icon name="mail" />
            {footer.contactButtonLabel}
          </Link>
        </div>

        <div className="ft-links">
          <nav aria-label="Footer">
            <Suspense fallback={<NavLinksStatic items={nav.items} className="ft-nav-list" newTabLabel={labels.newTab} />}>
              <NavLinks items={nav.items} className="ft-nav-list" newTabLabel={labels.newTab} />
            </Suspense>
          </nav>

          {business.instagramUrl && (
            <div className="ft-block">
              <h2 className="ft-heading">{footer.followHeading}</h2>
              <a className="ft-social" href={business.instagramUrl} {...externalLinkProps(business.instagramUrl)}>
                <Icon name="instagram" size={24} />
                <span className="sr-only">{labels.instagram}</span>
                {externalLinkProps(business.instagramUrl).target && <NewTabNote text={labels.newTab} />}
              </a>
            </div>
          )}

          <div className="ft-block">
            <h2 className="ft-heading">{footer.employeeHeading}</h2>
            <Link href="/employee" className="ft-text-link">
              {footer.employeeLinkLabel}
            </Link>
          </div>
        </div>

        <div className="ft-locations">
          {locations.map((l) => (
            <div className="ft-loc" key={l.id}>
              <h2 className="ft-heading ft-loc-name">{l.name}</h2>
              <address>
                <span className="ft-line">
                  <Icon name="pin" size={18} />
                  {/* The two address lines are wrapped in one span, so the link can be an inline-flex tap target. */}
                  {l.mapsUrl ? (
                    <a href={l.mapsUrl} className="ft-tap" {...externalLinkProps(l.mapsUrl)}>
                      <span>
                        {l.address.street}
                        <br />
                        {cityLine(l.address)}
                      </span>
                      {externalLinkProps(l.mapsUrl).target && <NewTabNote text={labels.newTab} />}
                    </a>
                  ) : (
                    <span>
                      {l.address.street}
                      <br />
                      {cityLine(l.address)}
                    </span>
                  )}
                </span>
                <span className="ft-line">
                  <Icon name="phone" size={18} />
                  <a href={phoneHref(l.phone)} className="ft-phone ft-tap">
                    {l.phone}
                  </a>
                </span>
              </address>
              {l.gateHours && (
                <p className="ft-line ft-hours">
                  <Icon name="clock" size={18} />
                  <span>
                    {labels.gateHours}: {l.gateHours}
                  </span>
                </p>
              )}
              {/* PLACEHOLDER: office hours are unknown; this shows only once the admin fills them in. */}
              {l.officeHours && (
                <p className="ft-line ft-hours">
                  <Icon name="clock" size={18} />
                  <span>
                    {labels.officeHours}: {l.officeHours}
                  </span>
                </p>
              )}
            </div>
          ))}
        </div>

        {footer.gallery.length > 0 && (
          <ul className="ft-gallery" role="list">
            {footer.gallery.map((p, i) => (
              <li key={`${p.src}-${i}`}>
                <Photo photo={p} sizes="(max-width: 680px) 30vw, (max-width: 1100px) 16vw, 140px" className="ft-thumb" quality={60} />
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="wrap-wide ft-bottom">
        <p>{withYear(footer.copyright, year)}</p>
      </div>
    </footer>
  );
}
