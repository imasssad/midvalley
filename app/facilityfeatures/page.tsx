// Facility Features (/facilityfeatures, same URL as the old site), in the "Valley glass" look:
// - Title block (PageHero) with the gate hours and a Facility Features list item as glass chips on the photo.
// - "On this page": a frosted rounded tray of glass pill links (glossy number dot + title) that overlaps the
//   hero's white ridge; wraps onto several lines on phones (no sideways scrolling).
// - The features as full-width rows on alternating grounds, two rows per ground (white, mist, white, mist…), with a
//   mountain ridge where the ground changes. Two compositions alternate:
//     A) layered: a big rounded photo with the text on a glossy card overlapping its edge (below it on phones);
//     B) editorial: the text beside the rounded photo, which sits on an offset dot-grid panel.
//   Each photo carries a glossy blue number badge ("01" / "08", decorative) over its top edge.
// - The closing "Reserve at <location>" band (CtaBand).
// Motion: the index pills come in one after another; in each row the text rises in from the side, the photo
// drifts with parallax (A) or is uncovered by a sliding curtain (B), lifts onto its glow on hover, and the badge
// pops in. Every word and photo comes from content.features (chips: content.labels/locations/home.features).
import type { Metadata } from "next";
import { CtaBand } from "@/components/CtaBand";
import { PopGroup, PopItem } from "@/components/home/Pop";
import { pickItems } from "@/components/home/pickItems";
import { Curtain } from "@/components/motion/Curtain";
import { Parallax } from "@/components/motion/Parallax";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/Reveal";
import { gateHoursChip, PageHero, type HeroChip } from "@/components/PageHero";
import { Photo } from "@/components/Photo";
import { Ridge } from "@/components/Ridge";
import { getSiteContent } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata("features", "/facilityfeatures");
}

/** "Temperature Controlled Storage" → "temperature-controlled-storage" (unique within the page). */
function anchorIds(titles: string[]): string[] {
  const seen = new Set<string>();
  return titles.map((t, i) => {
    let id = t
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    if (!id) id = `feature-${i + 1}`;
    while (seen.has(id)) id = `${id}-${i + 1}`;
    seen.add(id);
    return id;
  });
}

const SIZES_A = "(max-width: 900px) 92vw, (max-width: 1400px) 58vw, 820px";
const SIZES_B = "(max-width: 900px) 92vw, (max-width: 1400px) 55vw, 780px";
const two = (n: number) => String(n).padStart(2, "0");
/** Two rows per ground: white, white, mist, mist, white… */
const groundOf = (i: number) =>
  Math.floor(i / 2) % 2 === 0 ? "white" : "mist";

export default async function FeaturesPage() {
  const content = await getSiteContent();
  const { features, labels, home } = content;
  const items = features.items;
  const ids = anchorIds(items.map((f) => f.title));
  const total = two(items.length);

  const chips: HeroChip[] = [];
  const gate = gateHoursChip(content);
  if (gate) chips.push(gate);
  for (const t of pickItems(home.features.list, ["Huge Variety of Sizes"], 1))
    chips.push({ icon: "check", text: t });

  return (
    <>
      <PageHero
        heading={features.heading}
        photo={features.heroPhoto}
        chips={chips}
        next="var(--white)"
      />

      {items.length > 1 && (
        <nav className="ff-index" aria-label={labels.onThisPage}>
          <div className="wrap">
            <div className="ff-tray">
              <Stagger as="ul" className="ff-chips" gap={0.045}>
                {items.map((f, i) => (
                  <StaggerItem as="li" key={ids[i]}>
                    <a className="ff-chip" href={`#${ids[i]}`}>
                      <span className="ff-chip-no" aria-hidden="true">
                        {two(i + 1)}
                      </span>
                      {f.title}
                    </a>
                  </StaggerItem>
                ))}
              </Stagger>
            </div>
          </div>
        </nav>
      )}

      <div className="ff-list">
        {items.map((f, i) => {
          const layered = i % 2 === 0; // A rows: photo + overlapping card
          const ground = groundOf(i);
          const nextGround = i + 1 < items.length ? groundOf(i + 1) : null;
          const ridge = nextGround && nextGround !== ground ? nextGround : null;
          const img = (
            <Photo
              photo={f.photo}
              className="ff-ph"
              sizes={layered ? SIZES_A : SIZES_B}
            />
          );
          const rowClass = [
            "ff-row",
            layered ? "ff-row--a" : "ff-row--b",
            ground === "mist" ? "bg-sand" : "bg-bone",
            ridge ? "has-ridge" : "",
            i === 0 ? "is-first" : "",
          ]
            .filter(Boolean)
            .join(" ");
          return (
            <section
              key={ids[i]}
              id={ids[i]}
              className={rowClass}
              aria-labelledby={`${ids[i]}-heading`}
            >
              <div className="pg-decor" aria-hidden="true">
                <span className="glow-blob ff-blob" />
              </div>
              <div className="wrap ff-grid">
                <div className="ff-stage">
                  {!layered && (
                    <span className="dots ff-dots" aria-hidden="true" />
                  )}
                  <div className="ff-media frame">
                    {layered ? (
                      <Parallax className="ff-pic" strength={0.08}>
                        {img}
                      </Parallax>
                    ) : (
                      <Curtain className="ff-pic" color="sand">
                        {img}
                      </Curtain>
                    )}
                  </div>
                  {/* Decorative running number ("03" / "08"), generated from the list, not copy. */}
                  <PopGroup className="ff-badge-wrap" delay={0.35}>
                    <PopItem className="ff-badge">
                      <span aria-hidden="true">
                        <span className="ff-badge-n">{two(i + 1)}</span>
                        <span className="ff-badge-of">/ {total}</span>
                      </span>
                    </PopItem>
                  </PopGroup>
                </div>
                <Reveal
                  className="ff-text"
                  from={layered ? "right" : "left"}
                  y={40}
                  delay={0.1}
                >
                  <div className={layered ? "ff-card card" : "ff-plain"}>
                    <h2
                      id={`${ids[i]}-heading`}
                      className={layered ? undefined : "grad-text"}
                    >
                      {f.title}
                    </h2>
                    <p className="ff-body">{f.text}</p>
                  </div>
                </Reveal>
              </div>
              {ridge && (
                <Ridge
                  edge="bottom"
                  fill={ridge === "mist" ? "var(--mist)" : "var(--white)"}
                  height={64}
                  className="pg-ridge"
                />
              )}
            </section>
          );
        })}
      </div>

      <CtaBand
        content={content}
        heading={features.cta.heading}
        variant="reserve"
      />
    </>
  );
}
