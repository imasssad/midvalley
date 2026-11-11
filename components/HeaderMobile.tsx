"use client";

// Phone header actions (680px and below): "Make a Payment" and "Rent Online" buttons that each open a small
// panel with one link per location, then a "Call <location> <phone>" button per location. No hamburger menu.
//
// Without JavaScript the panels must still be usable. The server HTML renders the panels and their links with
// no `hidden` attribute; CSS hides them only under html.js (added by the layout's boot script before first paint)
// until this component has hydrated and taken over with the `hidden` attribute (data-ready). So:
// - JS on: the panels start closed, with no flash and no layout shift.
// - JS off: no .js class, the panels are simply visible under their buttons.
// - JS failed or very slow: the boot script removes .js after 4s and the panels show, so links stay reachable.
//   Once hydrated, the panels carry data-ready and the no-JS styling no longer applies to them.
// Until hydration the buttons cannot do anything, so they carry no aria-expanded / aria-controls (they would
// announce "collapsed" above a panel that is in fact showing).
import { useEffect, useRef, useState } from "react";
import type { Location, SiteContent } from "@/lib/content-schema";
import { phoneHref } from "@/lib/format";
import { externalLinkProps } from "@/lib/links";
import { Icon } from "./Icon";
import { NewTabNote } from "./NewTab";

type PanelKey = "pay" | "rent";
/** newTabLabel: content.labels.newTab. */
type Props = { header: SiteContent["header"]; locations: Location[]; newTabLabel: string };

const panelId = (key: PanelKey) => `hdr-m-${key}`;

export function HeaderMobile({ header, locations, newTabLabel }: Props) {
  const [open, setOpen] = useState<PanelKey | null>(null);
  // False in the server HTML and the first client render (no hydration mismatch); true once hydrated.
  const [ready, setReady] = useState(false);
  const buttons = useRef<Partial<Record<PanelKey, HTMLButtonElement | null>>>({});

  useEffect(() => setReady(true), []);

  // Escape closes the open panel. Focus goes back to the panel's button only when it was inside the panel (or on
  // that button): focus elsewhere on the page stays where it is.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      const button = buttons.current[open];
      const active = document.activeElement;
      const inPanel = !!active && (document.getElementById(panelId(open))?.contains(active) || active === button);
      setOpen(null);
      if (inPanel) button?.focus();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const rentable = locations.filter((l) => l.rentOnlineUrl);
  // One panel at a time: opening one closes the other.
  const toggle = (key: PanelKey) => setOpen((cur) => (cur === key ? null : key));

  const panelButton = (key: PanelKey, icon: "card" | "key", label: string) => (
    <button
      type="button"
      className="hm-btn hm-btn-navy"
      aria-expanded={ready ? open === key : undefined}
      aria-controls={ready ? panelId(key) : undefined}
      onClick={() => toggle(key)}
      ref={(el) => {
        buttons.current[key] = el;
      }}
    >
      <Icon name={icon} size={22} />
      <span className="hm-btn-label">{label}</span>
      <Icon name="chevronDown" size={20} className="hm-chev" />
    </button>
  );

  const panelProps = (key: PanelKey) => ({
    id: panelId(key),
    className: "hm-panel",
    "data-ready": ready ? "" : undefined,
    hidden: ready ? open !== key : undefined,
  });

  return (
    <div className="hdr-mobile">
      <div className="hm-item">
        {panelButton("pay", "card", header.mobilePaymentLabel)}
        <div {...panelProps("pay")}>
          <ul className="hm-links" role="list">
            {locations.map((l) => {
              const ext = externalLinkProps(l.paymentUrl);
              return (
                <li key={l.id}>
                  <a className="hm-link" href={l.paymentUrl} {...ext}>
                    <span className="hm-link-text">
                      <span className="sr-only">{header.mobilePaymentLabel}: </span>
                      <span className="hm-link-title">{l.name}</span>
                      <span className="sr-only">, </span>
                      <span className="hm-link-sub">{l.address.street}</span>
                      {ext.target && <NewTabNote text={newTabLabel} />}
                    </span>
                    <Icon name="arrow" size={20} />
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {rentable.length > 0 && (
        <div className="hm-item">
          {panelButton("rent", "key", header.mobileRentLabel)}
          <div {...panelProps("rent")}>
            {/* PLACEHOLDER (to confirm): rentOnlineUrl is the old QuikStor link until the client confirms it. */}
            <ul className="hm-links" role="list">
              {rentable.map((l) => {
                const ext = externalLinkProps(l.rentOnlineUrl);
                return (
                  <li key={l.id}>
                    <a className="hm-link" href={l.rentOnlineUrl} {...ext}>
                      <span className="hm-link-text">
                        <span className="sr-only">{header.mobileRentLabel}: </span>
                        <span className="hm-link-title">{l.brandName}</span>
                        {ext.target && <NewTabNote text={newTabLabel} />}
                      </span>
                      <Icon name="arrow" size={20} />
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}

      {locations.map((l) => (
        <a key={l.id} className="hm-btn hm-btn-call" href={phoneHref(l.phone)}>
          <Icon name="phone" size={22} />
          <span className="hm-btn-label">
            {header.mobileCallWord} {l.shortName} <span className="hm-phone">{l.phone}</span>
          </span>
        </a>
      ))}
    </div>
  );
}
