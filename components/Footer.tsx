// Site footer on the deep navy glossy band (the .bg-ink look with the dot-grid texture and two soft static glows),
// a little darker than the navy CTA band above it, with a light rule between them:
// - top: a rounded glass bar with the logo in white, the page links as pills (the current page a filled glossy blue
//   pill; on phones these are the main navigation, so they come first, as big two-per-row tap tiles) and the
//   Contact button (orange, the call to action). Source order = visual order at every width;
// - tiles: one rounded glass tile per location (a glossy blue band with the number chip and the name, like the
//   location cards, then address -> maps, phone, hours), and a Follow Us / Employee Portal tile;
// - a strip of six rounded square photos (hover: the photo rises a little onto a soft glow and the image grows
//   inside its box);
// - the sign-off: the business name set huge in condensed caps (decorative: hidden from screen readers, the logo
//   carries it);
// - the copyright line.
// The top bar rises in; the tiles, photos and the words of the big name rise in one after another as they scroll
// into view (Reveal / Stagger, transform and opacity only). Server component; the motion parts are small client
// components. Styles: app/styles/chrome.css (ft-).
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
    <footer className="site-footer bg-ink dots">
      {/* Decorative ground: two soft static glows, clipped to the footer. */}
      <div className="ft-decor" aria-hidden="true">
        <span className="ft-glow ft-glow-a" />
        <span className="ft-glow ft-glow-b" />
      </div>
      <div className="wrap">
        <Reveal className="ft-top" y={20}>
          {/* The real logo, turned white with a CSS filter so it reads on navy. */}
          <Link href="/" className="ft-logo">
            <Image
              src={business.logo.src}
              alt={business.logo.alt || business.name}
              width={166}
              height={96}
              unoptimized
            />
          </Link>
          {/* The page links (on phones the main navigation): pills here, big tap tiles on phones. */}
          <nav className="ft-nav" aria-label="Footer">
            <Suspense
              fallback={<NavLinksStatic items={nav.items} className="ft-nav-list" newTabLabel={labels.newTab} />}
            >
              <NavLinks items={nav.items} className="ft-nav-list" newTabLabel={labels.newTab} />
            </Suspense>
          </nav>
          <Link href="/contact" className="btn btn-cta ft-contact">
            <Icon name="mail" />
            {footer.contactButtonLabel}
          </Link>
        </Reveal>

        <Stagger className="ft-grid" gap={0.1}>
          {locations.map((l, i) => (
            <StaggerItem className="ft-col ft-loc" key={l.id}>
              {/* Glossy blue band, like the location cards: number chip (decorative) and the name. */}
              <div className="ft-loc-head">
                <span className="ft-no" aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h2 className="ft-loc-name">{l.name}</h2>
              </div>
              <div className="ft-loc-body">
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
              </div>
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
                  <Photo
                    photo={p}
                    sizes="(max-width: 680px) 31vw, (max-width: 1100px) 16vw, 230px"
                    className="ft-thumb"
                    quality={60}
                  />
                </StaggerItem>
              ))}
            </ul>
          </Stagger>
        )}

        {/* The business name, huge, as the footer's sign-off. Decorative: the logo
            link above already names it. */}
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
