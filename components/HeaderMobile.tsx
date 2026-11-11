"use client";

// Phone header actions (680px and below): a glossy navy "Make a Payment" button that opens a rounded navy panel
// with one white link tile per location, then a glossy orange "Call <location> <phone>" button per location. Each
// button's icon sits in a small rounded glass square. No hamburger menu. (Rent Online was left out of the header
// at the client's request; it stays on the location cards and the closing band.)
//
// Motion (motion/react, m.* only): the panels open and close with a smooth height + opacity transition (0.3s)
// and the chevron turns 180deg (transform). With prefers-reduced-motion the duration is 0, so the panels just
// appear and disappear (MotionConfig reducedMotion="user" skips transforms, not height, hence useReducedMotion).
// A closed panel gets the `hidden` attribute once its close animation has finished, so its links can never be
// reached with Tab or a screen reader while it is closed.
//
// Without JavaScript the panels must still be usable. The server HTML renders the panels and their links as a
// plain <div> with no `hidden` attribute and no inline styles; CSS hides them only under html.js (added by the
// layout's boot script before first paint) until this component has hydrated and taken over (data-ready). So:
// - JS on: the panels start closed, with no flash and no layout shift.
// - JS off: no .js class, the panels are simply visible under their buttons.
// - JS failed or very slow: the boot script removes .js after 4s and the panels show, so links stay reachable.
// Until hydration the buttons cannot do anything, so they carry no aria-expanded / aria-controls (they would
// announce "collapsed" above a panel that is in fact showing).
import { m, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { Location, SiteContent } from "@/lib/content-schema";
import { phoneHref } from "@/lib/format";
import { externalLinkProps } from "@/lib/links";
import { Icon } from "./Icon";
import { NewTabNote } from "./NewTab";

type PanelKey = "pay";
/** newTabLabel: content.labels.newTab. */
type Props = {
  header: SiteContent["header"];
  locations: Location[];
  newTabLabel: string;
};

const EASE = [0.22, 1, 0.36, 1] as const;
const DURATION = 0.3;
const panelId = (key: PanelKey) => `hdr-m-${key}`;

/** One panel. Before hydration: a plain div (visible without JS, hidden by CSS under html.js). After: an m.div
 *  whose height and opacity animate between 0 and "auto", and which is `hidden` once fully closed. */
function Panel({
  id,
  open,
  ready,
  children,
}: {
  id: string;
  open: boolean;
  ready: boolean;
  children: React.ReactNode;
}) {
  const reduce = useReducedMotion();
  // Shown while open or while the close animation runs. Derived during render (React's documented pattern):
  // opening shows it at once; with reduced motion closing hides it at once too.
  const [visible, setVisible] = useState(false);
  if (open && !visible) setVisible(true);
  if (!open && visible && reduce) setVisible(false);

  const inner = <div className="hm-panel-inner">{children}</div>;
  if (!ready) {
    return (
      <div id={id} className="hm-panel">
        {inner}
      </div>
    );
  }
  return (
    <m.div
      id={id}
      className="hm-panel"
      data-ready=""
      hidden={!visible}
      initial={false}
      animate={open ? "open" : "closed"}
      variants={{
        open: { height: "auto", opacity: 1 },
        closed: { height: 0, opacity: 0 },
      }}
      transition={{ duration: reduce ? 0 : DURATION, ease: EASE }}
      onAnimationComplete={(def) => {
        if (def === "closed") setVisible(false);
      }}
    >
      {inner}
    </m.div>
  );
}

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

  // One panel at a time: opening one closes the other.
  const toggle = (key: PanelKey) => setOpen((cur) => (cur === key ? null : key));

  const panelButton = (key: PanelKey, icon: "card", label: string) => (
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
      <span className="hm-icon">
        <Icon name={icon} size={20} />
      </span>
      <span className="hm-btn-label">{label}</span>
      {/* Chevron turns 180deg when the panel opens (transform). */}
      <m.span
        className="hm-chev"
        aria-hidden="true"
        initial={false}
        animate={{ rotate: ready && open === key ? 180 : 0 }}
        transition={{ duration: DURATION, ease: EASE }}
      >
        <Icon name="chevronDown" size={20} />
      </m.span>
    </button>
  );

  return (
    <div className="hdr-mobile">
      <div className="hm-item">
        {panelButton("pay", "card", header.mobilePaymentLabel)}
        <Panel id={panelId("pay")} open={open === "pay"} ready={ready}>
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
                    <span className="hm-link-go">
                      <Icon name="arrow" size={16} />
                    </span>
                  </a>
                </li>
              );
            })}
          </ul>
        </Panel>
      </div>

      {/* Call buttons: glossy orange rounded buttons (.btn .btn-cta, the call to action), in normal case. Press on
          tap; on hover only the face brightens (the header is static: no lift, no glow). */}
      {locations.map((l) => (
        <a key={l.id} className="btn btn-cta hm-btn hm-btn-call" href={phoneHref(l.phone)}>
          <span className="hm-icon">
            <Icon name="phone" size={20} />
          </span>
          <span className="hm-btn-label">
            {header.mobileCallWord} {l.shortName} <span className="hm-phone">{l.phone}</span>
          </span>
        </a>
      ))}
    </div>
  );
}
