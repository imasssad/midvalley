// Site header (layout fixed by the client): logo on the left and, on the right, two rows that take visitors
// straight to payment and phone for each location (as on the old site; the client asked to leave Rent Online
// out of the header, it stays on the location cards and the closing band). Below them, a slim page nav.
//
// "Valley glass" composition (static, never animated in, so it paints at once; normal document flow, never fixed
// or sticky, so it can never cover the promo banner below):
// - the ground: a soft white-to-mist gradient with a thin glossy blue line on top, a faint dot grid that fades out
//   towards the logo, a soft blue glow behind the buttons and a faint double mountain ridge (the "valley" from the
//   logo) along the bottom. All decorative, in one aria-hidden layer that clips to the header;
// - the logo on a rounded white plate with a soft blue glow;
// - the two rows inside a rounded frosted "console" panel: each row label ends in a round blue chevron chip, the
//   navy boxes have a glossy face, the icon in a small rounded glass square and a small arrow chip on the right
//   that nudges on hover. Text is white in every state; hover only lightens the box background a little;
//   no lift on the header boxes;
// - the page nav as a frosted pill bar: the current page is a filled glossy blue pill, hover fades in a light
//   blue pill (opacity and transform only).
// On phones the rows and the nav are hidden and HeaderMobile shows big stacked buttons instead (both are in the
// HTML; CSS shows one or the other with display: none). Styles: app/styles/chrome.css (hdr-, hm-).
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
import { Ridge } from "./Ridge";

/** One row: the label with a round chevron chip, then one navy box per location. Each box's link text repeats the
 *  row label for screen readers ("Make a payment: Visalia Noble, 15323 E. Noble Ave. (opens in a new tab)"), so
 *  the links make sense on their own, for example in a screen reader's list of links. The visible label is
 *  therefore aria-hidden, so it is not read twice. */
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="hdr-row">
      <p className="hdr-label" aria-hidden="true">
        <span className="hdr-label-text">{label}</span>
        <span className="hdr-label-chip">
          <Icon name="chevron" size={14} />
        </span>
      </p>
      {children}
    </div>
  );
}

/** The inside of a navy box: icon in a glass square, the text, and a small arrow chip (decorative). */
function BoxFace({ icon, children }: { icon: "card" | "phone"; children: React.ReactNode }) {
  return (
    <>
      <span className="hdr-box-icon">
        <Icon name={icon} size={18} />
      </span>
      <span className="hdr-box-text">{children}</span>
      <span className="hdr-box-go">
        <Icon name="arrow" size={13} />
      </span>
    </>
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
      {/* Decorative ground: dot grid, glow and the valley ridge. Clipped to the header, behind everything. */}
      <div className="hdr-decor" aria-hidden="true">
        <span className="hdr-dots dots" />
        <span className="hdr-glow" />
        <Ridge edge="bottom" fill="rgba(0, 84, 151, 0.09)" height={64} className="hdr-ridge" />
      </div>

      <div className="wrap hdr-main">
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

        {/* Desktop and tablet (above 680px): the console panel. */}
        <div className="hdr-rows" style={cols}>
          <Row label={header.paymentLabel}>
            {locations.map((l) => (
              <a key={l.id} className="hdr-box" href={l.paymentUrl} {...externalLinkProps(l.paymentUrl)}>
                <BoxFace icon="card">
                  <span className="sr-only">{header.paymentLabel}: </span>
                  <span className="hdr-box-title">{l.name}</span>
                  <span className="sr-only">, </span>
                  <span className="hdr-box-sub">{l.address.street}</span>
                  {newTab(l.paymentUrl)}
                </BoxFace>
              </a>
            ))}
          </Row>

          <Row label={header.callLabel}>
            {locations.map((l) => (
              <a key={l.id} className="hdr-box" href={phoneHref(l.phone)}>
                <BoxFace icon="phone">
                  <span className="sr-only">{header.callLabel}: </span>
                  <span className="hdr-box-title">{l.brandName}</span>
                  <span className="sr-only">, {l.phone}</span>
                </BoxFace>
              </a>
            ))}
          </Row>
        </div>

        {/* Phone (680px and below). */}
        <HeaderMobile header={header} locations={locations} newTabLabel={labels.newTab} />
      </div>

      {/* Slim page nav (pill bar), above 680px only (on phones the footer holds these links). */}
      <nav className="hdr-nav" aria-label="Main">
        <div className="wrap">
          <Suspense
            fallback={<NavLinksStatic items={nav.items} className="hdr-nav-list" newTabLabel={labels.newTab} />}
          >
            <NavLinks items={nav.items} className="hdr-nav-list" newTabLabel={labels.newTab} />
          </Suspense>
        </div>
      </nav>
    </header>
  );
}
