// "Facility Features" as a full-bleed glossy blue band with a dot texture (.bg-blue.dots), framed by mountain
// ridges: the mist of Storage Options hangs over its top edge, and its bottom rises into what follows (white
// reviews when there are some, otherwise the navy closing band). Left: section pill, heading and intro (white).
// Right: the rounded boat photo (.frame) with a floating white glass chip on its bottom edge (the gate hours when
// every location shares them, otherwise a Facility Features item). Below: the 12 features as a cloud of glass
// pills, each with a round white check, wrapping freely (2-3 short ones per row on phones).
// Motion: heading and intro rise in (Reveal), the photo block slides in from the right and its photo moves with
// parallax (±7%) and zooms a touch on hover; the chip floats in after it, and the pills pop in one after another
// (PopGroup/PopItem: scale .9 -> 1 and opacity) and lift on hover (CSS).
import { Icon } from "@/components/Icon";
import { Parallax } from "@/components/motion/Parallax";
import { Reveal } from "@/components/motion/Reveal";
import { Photo } from "@/components/Photo";
import { Ridge } from "@/components/Ridge";
import type { SiteContent } from "@/lib/content-schema";
import { pickItems } from "./pickItems";
import { PopGroup, PopItem } from "./Pop";

/** Shown on the photo when the locations don't share one set of gate hours. */
const PHOTO_ITEM = ["Indoor private RV/Boat storage with individual lights and power"];

export function FeaturesList({ content, no }: { content: SiteContent; no: string }) {
  const { features } = content.home;
  const { locations, labels, testimonials } = content;
  const hours = locations.items.map((l) => l.gateHours.trim());
  const sharedHours = hours.length > 0 && hours[0] !== "" && hours.every((h) => h === hours[0]) ? hours[0] : "";
  const [photoItem] = pickItems(features.list, PHOTO_ITEM, 1);
  // The bottom ridge takes the colour of the next section: white reviews, or the navy closing band.
  const nextFill = testimonials.items.length > 0 ? "var(--white)" : "url(#h-ridge-navy)";

  return (
    <section id="features" className="section bg-blue dots h-features" aria-labelledby="home-features-heading">
      <Ridge edge="top" fill="var(--mist)" height={72} className="h-ridge" />
      <span className="glow-blob h-feat-blob" aria-hidden="true" />
      <div className="wrap h-layer">
        <div className="h-features-top">
          <div className="h-features-text">
            <Reveal className="sec-head">
              <span className="sec-no" aria-hidden="true">
                {no}
              </span>
              <h2 id="home-features-heading">{features.heading}</h2>
            </Reveal>
            <Reveal className="h-features-intro" delay={0.05}>
              <p className="lede">{features.intro}</p>
            </Reveal>
          </div>
          <div className="h-features-stage">
            <Reveal className="h-features-media" from="right" delay={0.15}>
              <div className="frame h-features-frame">
                <Parallax className="h-features-photo" strength={0.07}>
                  <Photo photo={features.photo} className="h-fill h-zoom" sizes="(max-width: 900px) 92vw, (max-width: 1500px) 52vw, 760px" />
                </Parallax>
              </div>
            </Reveal>
            {(sharedHours || photoItem) && (
              <PopGroup className="h-features-float" delay={0.5}>
                <PopItem className="chip h-features-chip" from={{ x: -24, y: 8 }}>
                  <span className="chip-dot" aria-hidden="true">
                    <Icon name={sharedHours ? "clock" : "check"} size={15} />
                  </span>
                  {sharedHours ? (
                    <span className="h-features-chip-text">
                      <span className="h-features-chip-label">{labels.gateHours}</span>
                      <span className="h-features-chip-value">{sharedHours}</span>
                    </span>
                  ) : (
                    photoItem
                  )}
                </PopItem>
              </PopGroup>
            )}
          </div>
        </div>
        <PopGroup as="ul" className="h-cloud" gap={0.045} delay={0.1}>
          {features.list.map((item, i) => (
            <PopItem as="li" className="chip chip-dark h-pill" key={`${i}-${item}`}>
              <span className="chip-dot" aria-hidden="true">
                <Icon name="check" size={15} />
              </span>
              {item}
            </PopItem>
          ))}
        </PopGroup>
      </div>
      {/* Matches the top edge of the navy closing band (components/CtaBand.tsx, .bg-ink): its navy gradient with
          the faint gloss in the middle. Zero-size (not display: none, which would switch the gradient off). */}
      <svg className="h-defs" width="0" height="0" aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id="h-ridge-navy" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#144273" />
            <stop offset="0.5" stopColor="#19436f" />
            <stop offset="1" stopColor="#12395f" />
          </linearGradient>
        </defs>
      </svg>
      <Ridge edge="bottom" fill={nextFill} height={72} className="h-ridge" />
    </section>
  );
}
