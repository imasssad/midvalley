// Title block at the top of the inner pages (About Us, Facility Features, Contact Us), in the "Valley glass" look.
// A mist-to-blue-tint ground with a fading dot grid and two soft static glows, and a mountain ridge at the bottom
// in the colour of the section that follows (`next`). Left: a short glossy bar and the page's one h1 in huge
// condensed caps with the navy-to-blue gradient fill (.grad-text). Right (below the title on tablets and phones):
// the page's wide photo, rounded on a soft blue glow (.frame), over an offset dot-grid panel, with glass chips
// (real content only: location names, gate hours, Facility Features items) floating over its edges; on phones the
// chips sit in a row overlapping the photo's bottom edge.
// Above the fold, so the entrance is pure CSS (app/styles/pages.css) and starts on first paint: the bar grows in
// and the h1 rises in, a navy curtain slides off the rounded photo while the photo settles from a slight zoom, the
// glow fades in under it, then the chips pop in one after another. Transform and opacity only; nothing animates
// with prefers-reduced-motion. No copy of its own: everything is passed in.
import type { Photo as PhotoData, SiteContent } from "@/lib/content-schema";
import { Icon, type IconKey } from "./Icon";
import { Photo } from "./Photo";
import { Ridge } from "./Ridge";

export type HeroChip = {
  icon: IconKey;
  text: string;
  /** Optional small caps label above the text (e.g. "Gate hours"). */
  label?: string;
};

type Props = {
  heading: string;
  photo: PhotoData;
  /** Optional small label under the heading (from content). */
  eyebrow?: string;
  id?: string;
  /** Glass chips floating on the photo (content only). */
  chips?: HeroChip[];
  /** True when the chips only repeat what the page shows again below: then screen readers skip them. */
  chipsDecorative?: boolean;
  /** Ground colour of the section after the hero: the ridge at the bottom is drawn in it. */
  next?: string;
};

const order = (i: number) => ({ "--i": i }) as React.CSSProperties;

/** "Gate hours: 6AM to 8PM" as a chip, when every location has the same (non-empty) gate hours. */
export function gateHoursChip(content: SiteContent): HeroChip | null {
  const hours = content.locations.items.map((l) => l.gateHours.trim());
  if (!hours[0] || hours.some((h) => h !== hours[0])) return null;
  return { icon: "clock", label: content.labels.gateHours, text: hours[0] };
}

export function PageHero({
  heading,
  photo,
  eyebrow,
  id = "page-title",
  chips = [],
  chipsDecorative,
  next = "var(--white)",
}: Props) {
  return (
    <header className="ph" aria-labelledby={id}>
      <div className="ph-decor" aria-hidden="true">
        <span className="dots ph-dots" />
        <span className="glow-blob ph-blob" />
        <span className="glow-blob ph-blob-2" />
      </div>
      <div className="wrap ph-grid">
        <div className="ph-title">
          {/* Decorative glossy bar, not copy. */}
          <span className="ph-mark" aria-hidden="true" />
          <h1 id={id} className="grad-text enter-rise" style={order(0)}>
            {heading}
          </h1>
          {eyebrow && (
            <p className="ph-eyebrow enter-rise" style={order(1)}>
              {eyebrow}
            </p>
          )}
        </div>
        <div className="ph-stage">
          <span className="dots ph-stage-dots" aria-hidden="true" />
          <div className="ph-media frame">
            <div className="ph-pic">
              <Photo
                photo={photo}
                sizes="(max-width: 900px) 100vw, 56vw"
                className="ph-photo"
                eager
              />
              <span className="ph-cover" aria-hidden="true" />
            </div>
          </div>
          {chips.length > 0 && (
            <ul className="ph-chips" aria-hidden={chipsDecorative || undefined}>
              {chips.map((c, i) => (
                <li
                  key={`${c.text}-${i}`}
                  className={`chip ph-chip ph-chip-${(i % 3) + 1}`}
                  style={order(i)}
                >
                  <span className="chip-dot" aria-hidden="true">
                    <Icon name={c.icon} size={15} />
                  </span>
                  {c.label ? (
                    <span className="ph-chip-text">
                      <span className="ph-chip-label">{c.label}</span>
                      <span className="ph-chip-value">{c.text}</span>
                    </span>
                  ) : (
                    c.text
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <Ridge edge="bottom" fill={next} height={72} className="pg-ridge" />
    </header>
  );
}
