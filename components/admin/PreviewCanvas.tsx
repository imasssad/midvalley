"use client";

// The inside of a live preview (app/admin/preview). The editor sends the draft content with postMessage and this
// draws the website's OWN components with it (Header, HeroBanner, the homepage sections, LocationCard, CtaBand,
// PageHero, ContactForm, Footer), so the preview always looks like the real thing. It runs in its own frame so the
// website's styles and screen-size rules apply exactly as they do on the site. It only imports those components;
// the public pages' code paths are untouched.
//
// Not previewed (their markup lives inside server page files that read the content on the server): the body of the
// About Us page (story, photos, timeline), the feature sections of the Facility Features page, the Contact page's
// maps and Instagram box, the Employee Portal and the 404 page. Their screens say so above the preview.
import { Component, useEffect, useRef, useState, type ReactNode } from "react";
import { ContactForm } from "@/components/ContactForm";
import { CtaBand } from "@/components/CtaBand";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { AboutIntro } from "@/components/home/AboutIntro";
import { FeaturesList } from "@/components/home/FeaturesList";
import { HeroBanner } from "@/components/home/HeroBanner";
import { Locations } from "@/components/home/Locations";
import { pickItems } from "@/components/home/pickItems";
import { StorageOptions } from "@/components/home/StorageOptions";
import { Testimonials } from "@/components/home/Testimonials";
import { ValueStrip } from "@/components/home/ValueStrip";
import { LocationCard } from "@/components/LocationCard";
import { gateHoursChip, PageHero, type HeroChip } from "@/components/PageHero";
import type { SiteContent } from "@/lib/content-schema";
import type { ScreenKey } from "@/lib/screens";
import { PREVIEW_MSG, previewParts, type PreviewLayout, type PreviewTarget } from "./preview-protocol";

type Ctx = { c: SiteContent; now: number; target: PreviewTarget };
type Part = {
  id: string;
  screen: ScreenKey;
  render: (x: Ctx) => ReactNode;
  /** Why the website doesn't show this part right now, if it doesn't. */
  hidden?: (x: Ctx) => string | null;
};

const featureChips = (c: SiteContent): HeroChip[] => {
  const chips: HeroChip[] = [];
  const gate = gateHoursChip(c);
  if (gate) chips.push(gate);
  for (const t of pickItems(c.home.features.list, ["Huge Variety of Sizes"], 1)) chips.push({ icon: "check", text: t });
  return chips;
};

const parts: Part[] = [
  { id: "header", screen: "header", render: ({ c }) => <Header content={c} /> },
  { id: "hero", screen: "banner", render: ({ c }) => <HeroBanner content={c} /> },
  {
    id: "valueStrip",
    screen: "home",
    render: ({ c }) => <ValueStrip content={c} />,
    hidden: ({ c }) => (!c.valueStrip.enabled ? "The value strip is switched off." : c.valueStrip.items.length ? null : "The value strip is hidden because it has no points."),
  },
  { id: "about", screen: "home", render: ({ c }) => <AboutIntro content={c} no="01" /> },
  { id: "locations", screen: "locations", render: ({ c }) => <Locations content={c} no="02" /> },
  { id: "storage", screen: "home", render: ({ c }) => <StorageOptions content={c} no="03" /> },
  { id: "features", screen: "home", render: ({ c }) => <FeaturesList content={c} no="04" /> },
  {
    id: "reviews",
    screen: "reviews",
    render: ({ c }) => <Testimonials content={c} no="05" />,
    hidden: ({ c }) => (c.testimonials.items.length ? null : "The reviews section is hidden until there is at least one review."),
  },
  { id: "cta", screen: "home", render: ({ c }) => <CtaBand content={c} heading={c.home.cta.heading} variant="rent" /> },
  {
    id: "aboutHero",
    screen: "about",
    render: ({ c }) => (
      <PageHero heading={c.about.heading} photo={c.about.heroPhoto} chips={c.locations.items.map((l) => ({ icon: "pin" as const, text: l.name }))} />
    ),
  },
  { id: "aboutCta", screen: "about", render: ({ c }) => <CtaBand content={c} heading={c.about.cta.heading} variant="reserve" id="preview-about-cta" /> },
  { id: "featuresHero", screen: "features", render: ({ c }) => <PageHero heading={c.features.heading} photo={c.features.heroPhoto} chips={featureChips(c)} /> },
  { id: "featuresCta", screen: "features", render: ({ c }) => <CtaBand content={c} heading={c.features.cta.heading} variant="reserve" id="preview-features-cta" /> },
  {
    id: "contactHero",
    screen: "contact",
    render: ({ c }) => (
      <PageHero
        heading={c.contact.heading}
        photo={c.contact.heroPhoto}
        chips={c.locations.items.map((l) => ({ icon: "phone" as const, label: l.name, text: l.phone }))}
        chipsDecorative
      />
    ),
  },
  {
    id: "contactPage",
    screen: "contact",
    render: ({ c }) => (
      <div className="section bg-sand preview-section">
        <div className="wrap">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem" }}>
            {c.locations.items.map((l, i) => (
              <LocationCard key={l.id} location={l} content={c} headingLevel="h2" index={i} />
            ))}
          </div>
          <section className="ct-form card" aria-label={c.contact.formHeading} style={{ marginTop: "2rem" }}>
            <div className="card-band ct-form-band">
              <h2>{c.contact.formHeading}</h2>
            </div>
            <div className="ct-form-body">
              <ContactForm
                locations={c.locations.items.map((l) => ({ name: l.name, phone: l.phone }))}
                submitLabel={c.contact.submitLabel}
                callWord={c.header.mobileCallWord}
                fields={c.contact.fields}
                messages={c.contact.messages}
                requiredLabel={c.labels.required}
                sendAnotherLabel={c.contact.messages.sendAnother}
              />
            </div>
          </section>
        </div>
      </div>
    ),
  },
  { id: "footer", screen: "footer", render: ({ c, now }) => <Footer content={c} year={new Date(now).getFullYear()} /> },
];

/** Half-typed content can trip a section up; show a note instead of a blank preview, and retry on the next change. */
class Guard extends Component<{ attempt: number; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidUpdate(prev: { attempt: number }) {
    if (this.state.failed && prev.attempt !== this.props.attempt) this.setState({ failed: false });
  }
  render() {
    return this.state.failed ? <p className="preview-note">The preview will come back once the fields marked in red are filled in.</p> : this.props.children;
  }
}

export function PreviewCanvas() {
  const [state, setState] = useState<{ target: PreviewTarget; content: SiteContent; now: number; n: number } | null>(null);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // The site hides scroll-reveal blocks until they scroll into view; in a preview everything shows at once
    // (admin.css also forces them visible inside .preview-root).
    window.__mvsMotion = true;
    const t = setTimeout(() => document.documentElement.classList.remove("js"), 0);
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== location.origin || e.source !== window.parent) return;
      const d = e.data as { type?: string; target: PreviewTarget; content: SiteContent; now: number };
      if (d?.type === PREVIEW_MSG.hello) window.parent.postMessage({ type: PREVIEW_MSG.ready }, location.origin);
      if (d?.type === PREVIEW_MSG.content) setState((s) => ({ target: d.target, content: d.content, now: d.now, n: (s?.n ?? 0) + 1 }));
    };
    window.addEventListener("message", onMessage);
    if (window.parent !== window) window.parent.postMessage({ type: PREVIEW_MSG.ready }, location.origin);
    return () => {
      clearTimeout(t);
      window.removeEventListener("message", onMessage);
    };
  }, []);

  // Report the height and where each part sits, so the editor can size the frame.
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const report = () => {
      const zones = [...el.querySelectorAll<HTMLElement>("[data-screen]")].map((z) => ({
        screen: z.dataset.screen as ScreenKey,
        part: z.dataset.part ?? "",
        top: z.offsetTop,
        height: z.offsetHeight,
      }));
      const layout: PreviewLayout = { height: el.offsetHeight, zones };
      window.parent.postMessage({ type: PREVIEW_MSG.layout, ...layout }, location.origin);
    };
    const ro = new ResizeObserver(report);
    ro.observe(el);
    for (const child of el.children) ro.observe(child);
    report();
    return () => ro.disconnect();
  }, [state?.target, state?.n]);

  if (!state) return <div ref={root} className="preview-root" />;
  const ctx: Ctx = { c: state.content, now: state.now, target: state.target };
  const ids = previewParts[state.target] ?? [];
  return (
    <div ref={root} className="preview-root" inert>
      {parts
        .filter((p) => ids.includes(p.id))
        .sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id))
        .map((p) => {
          const reason = p.hidden?.(ctx) ?? null;
          if (reason && state.target === "all") return null; // the overview shows the page as visitors see it
          return (
            <div key={p.id} data-screen={p.screen} data-part={p.id}>
              {reason ? <p className="preview-note">{reason}</p> : <Guard attempt={state.n}>{p.render(ctx)}</Guard>}
            </div>
          );
        })}
    </div>
  );
}
