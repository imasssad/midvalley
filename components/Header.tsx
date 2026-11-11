// Site header (layout fixed by the client): logo on the left and, on the right, three rows that take visitors
// straight to payment, phone and online rental for each location. Below it, a slim page nav row. In normal
// document flow (never fixed or sticky). On phones the three rows and the nav row are hidden and HeaderMobile
// shows four big buttons instead (both are in the HTML; CSS shows one or the other with display: none).
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import type { SiteContent } from "@/lib/content-schema";
import { phoneHref } from "@/lib/format";
import { externalLinkProps } from "@/lib/links";
import { HeaderMobile } from "./HeaderMobile";
import { Icon } from "./Icon";
import { NavLinks, NavLinksStatic } from "./NavLinks";
import { NewTabNote } from "./NewTab";

/** One row: the label with a ">" chevron, then one navy box per location. Each box's link text repeats the row
 *  label for screen readers ("Make a payment: Visalia Noble, 15323 E. Noble Ave. (opens in a new tab)"), so the
 *  links make sense on their own, for example in a screen reader's list of links. */
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="hdr-row">
      <p className="hdr-label">
        {label}
        <Icon name="chevron" size={18} />
      </p>
      {children}
    </div>
  );
}

export function Header({ content }: { content: SiteContent }) {
  const { business, header, nav, labels } = content;
  /** Screen-reader note for links that open in a new tab (content.labels.newTab). */
  const newTab = (href: string) => (externalLinkProps(href).target ? <NewTabNote text={labels.newTab} /> : null);
  const locations = content.locations.items;
  // The rows' grid has one box column per location (two today).
  const cols = { "--hdr-cols": locations.length } as React.CSSProperties;

  return (
    <header className="site-header">
      <div className="wrap-wide hdr-main">
        <Link href="/" className="hdr-logo">
          {/* The real SVG logo (166x96 viewBox). Explicit size: no layout shift. SVGs are served unoptimized. */}
          <Image
            src={business.logo.src}
            alt={business.logo.alt || business.name}
            width={166}
            height={96}
            unoptimized
            loading="eager"
          />
        </Link>

        {/* Desktop and tablet (above 680px). */}
        <div className="hdr-rows" style={cols}>
          <Row label={header.paymentLabel}>
            {locations.map((l) => (
              <a key={l.id} className="hdr-box" href={l.paymentUrl} {...externalLinkProps(l.paymentUrl)}>
                <Icon name="card" size={22} />
                <span className="hdr-box-text">
                  <span className="sr-only">{header.paymentLabel}: </span>
                  <span className="hdr-box-title">{l.name}</span>
                  <span className="sr-only">, </span>
                  <span className="hdr-box-sub">{l.address.street}</span>
                  {newTab(l.paymentUrl)}
                </span>
              </a>
            ))}
          </Row>

          <Row label={header.callLabel}>
            {locations.map((l) => (
              <a key={l.id} className="hdr-box" href={phoneHref(l.phone)}>
                <Icon name="phone" size={22} />
                <span className="hdr-box-text">
                  <span className="sr-only">{header.callLabel}: </span>
                  <span className="hdr-box-title">{l.brandName}</span>
                  <span className="sr-only">, {l.phone}</span>
                </span>
              </a>
            ))}
          </Row>

          {locations.some((l) => l.rentOnlineUrl) && (
            <Row label={header.rentLabel}>
              {/* PLACEHOLDER (to confirm): these are the old QuikStor links until the client confirms. A location
                  without a link gets an empty cell, so the boxes stay lined up with the rows above. */}
              {locations.map((l) =>
                l.rentOnlineUrl ? (
                  <a key={l.id} className="hdr-box" href={l.rentOnlineUrl} {...externalLinkProps(l.rentOnlineUrl)}>
                    <Icon name="key" size={22} />
                    <span className="hdr-box-text">
                      <span className="sr-only">{header.rentLabel}: </span>
                      <span className="hdr-box-title">{l.brandName}</span>
                      {newTab(l.rentOnlineUrl)}
                    </span>
                  </a>
                ) : (
                  <span key={l.id} className="hdr-box-empty" aria-hidden="true" />
                ),
              )}
            </Row>
          )}
        </div>

        {/* Phone (680px and below). */}
        <HeaderMobile header={header} locations={locations} newTabLabel={labels.newTab} />
      </div>

      {/* Slim page nav row, above 680px only (on phones the footer holds these links). */}
      <nav className="hdr-nav" aria-label="Main">
        <div className="wrap-wide">
          <Suspense fallback={<NavLinksStatic items={nav.items} className="hdr-nav-list" newTabLabel={labels.newTab} />}>
            <NavLinks items={nav.items} className="hdr-nav-list" newTabLabel={labels.newTab} />
          </Suspense>
        </div>
      </nav>
    </header>
  );
}
