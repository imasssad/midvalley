// Site footer on the deep navy glossy band (a little darker than the navy CTA band above, with a rule between them):
// - top row: the logo in white and the Contact button;
// - columns: the page links (on phones these are the main navigation, so they come first, as big tap targets),
//   one numbered column per location (address -> maps, phone, hours), then Follow Us / Employee Portal, the
//   location and Follow / Employee columns as rounded glassy tiles;
// - a strip of six rounded square photos (hover: the photo grows a little inside its box);
// - the business name set huge in condensed caps (decorative: hidden from screen readers, the logo carries it);
// - the copyright line.
// Columns, photos and the big name rise in one after another as they scroll into view (Stagger, transform and
// opacity only). Server component; the motion parts are small client components. Styles: app/styles/chrome.css (ft-).
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import type { SiteContent } from "@/lib/content-schema";
import { cityLine, phoneHref, withYear } from "@/lib/format";
import { externalLinkProps } from "@/lib/links";
import { Icon } from "./Icon";
import { Reveal, Stagger, StaggerItem } from "./motion/Reveal";
import { NavLinks, NavLinksStatic } from "./NavLinks";
import { NewTabNote } from "./NewTab";
import { Photo } from "./Photo";

export function Footer({ content, year }: { content: SiteContent; year: number }) {
  const { business, footer, nav, labels } = content;
  const locations = content.locations.items;
  const igProps = business.instagramUrl ? externalLinkProps(business.instagramUrl) : null;

  return (
    <footer className="site-footer bg-ink">
      <div className="wrap">
        <Reveal className="ft-top" y={20}>
          {/* The real logo, turned white with a CSS filter so it reads on navy. */}
          <Link href="/" className="ft-logo">
            <Image src={business.logo.src} alt={business.logo.alt || business.name} width={166} height={96} unoptimized />
          </Link>
          <Link href="/contact" className="btn btn-cta ft-contact">
            <Icon name="mail" />
            {footer.contactButtonLabel}
          </Link>
        </Reveal>

        <Stagger className="ft-grid" gap={0.1}>
          <StaggerItem className="ft-col ft-col-nav">
            <nav aria-label="Footer">
              <Suspense fallback={<NavLinksStatic items={nav.items} className="ft-nav-list" newTabLabel={labels.newTab} />}>
                <NavLinks items={nav.items} className="ft-nav-list" newTabLabel={labels.newTab} />
              </Suspense>
            </nav>
          </StaggerItem>

          {locations.map((l, i) => (
            <StaggerItem className="ft-col ft-loc" key={l.id}>
              <span className="ft-no" aria-hidden="true">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h2 className="ft-loc-name">{l.name}</h2>
              <address>
                <span className="ft-line">
                  <Icon name="pin" size={18} />
                  {/* The two address lines are wrapped in one span, so the link can be an inline-flex tap target. */}
                  {l.mapsUrl ? (
                    <a href={l.mapsUrl} className="ft-addr ft-tap" {...externalLinkProps(l.mapsUrl)}>
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
            </StaggerItem>
          ))}

          <StaggerItem className="ft-col ft-more">
            {business.instagramUrl && igProps && (
              <div className="ft-block">
                <h2 className="ft-heading">{footer.followHeading}</h2>
                <a className="link-draw ft-link" href={business.instagramUrl} {...igProps}>
                  <Icon name="instagram" size={22} />
                  {labels.instagram}
                  {igProps.target && <NewTabNote text={labels.newTab} />}
                </a>
              </div>
            )}
            <div className="ft-block">
              <h2 className="ft-heading">{footer.employeeHeading}</h2>
              <Link href="/employee" className="link-draw ft-link">
                {footer.employeeLinkLabel}
                <Icon name="arrow" size={18} className="ft-arrow" />
              </Link>
            </div>
          </StaggerItem>
        </Stagger>

        {footer.gallery.length > 0 && (
          // Stagger's variants reach the <li> items through the plain <ul> (Motion passes them down by context).
          <Stagger className="ft-strip" gap={0.06}>
            <ul className="ft-gallery" role="list">
              {footer.gallery.map((p, i) => (
                <StaggerItem as="li" className="ft-gallery-item" key={`${p.src}-${i}`}>
                  <Photo photo={p} sizes="(max-width: 680px) 31vw, (max-width: 1100px) 16vw, 230px" className="ft-thumb" quality={60} />
                </StaggerItem>
              ))}
            </ul>
          </Stagger>
        )}

        {/* The business name, huge, as the footer's sign-off. Decorative: the logo link above already names it. */}
        <div className="ft-word" aria-hidden="true">
          <Stagger className="ft-word-inner" gap={0.08}>
            {business.name.split(/\s+/).map((word, i) => (
              <StaggerItem className="ft-word-part" key={`${word}-${i}`}>
                {word}
              </StaggerItem>
            ))}
          </Stagger>
        </div>

        <div className="ft-bottom">
          <p>{withYear(footer.copyright, year)}</p>
        </div>
      </div>
    </footer>
  );
}
