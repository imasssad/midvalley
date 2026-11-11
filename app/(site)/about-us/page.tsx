// About Us (/about-us, same URL as the old site), in the "Valley glass" look:
// - Title block (PageHero) with the location names as glass chips on the photo; then
// - "01 Our Story": an editorial split on white. Left: the section head (glass number pill, gradient heading,
//   glossy bar) and the story with a drop cap set in a small glossy blue tile. Right: a rounded bento mosaic of
//   the story photos (one big, small, tall and wide cells) over a soft glow and an offset dot-grid panel. A mist
//   bottom edge leads into
// - "02 Our History" on dotted mist: a timeline of glossy rounded cards (years big in gradient text) hung off a
//   glowing gradient line with round glossy nodes. Above 1100px the line runs across and the cards zig-zag above
//   and below it; 681-1100px the line runs down the middle and the cards alternate sides; phones: line down the left.
// - the closing "Reserve at <location>" band (CtaBand).
// Motion: section heads and story text rise in on scroll (Reveal); mosaic photos are uncovered by sliding curtains
// (one cell drifts with parallax instead) and lift onto their glow on hover; timeline cards come in one after
// another (Stagger), so the line builds up segment by segment, and lift with their node on hover.
// Every word and photo comes from the editable content (content.about, content.locations).
import type { Metadata } from "next";
import { CtaBand } from "@/components/CtaBand";
import { Curtain } from "@/components/motion/Curtain";
import { Parallax } from "@/components/motion/Parallax";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/Reveal";
import { PageHero } from "@/components/PageHero";
import { Photo } from "@/components/Photo";
import type { Photo as PhotoData } from "@/lib/content-schema";
import { getSiteContent } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata("about", "/about-us");
}

type Cell = "big" | "small" | "tall" | "wide" | "full";

/** Bento cells for n photos: full groups of four fill a 6x3 block (big, small, tall, wide); a remainder of 1-3
 *  photos still closes the rectangle (full / big + tall / big + small + small). */
function bento(n: number): Cell[] {
  const out: Cell[] = [];
  const full = Math.floor(n / 4);
  for (let g = 0; g < full; g++) out.push("big", "small", "tall", "wide");
  const rest = n % 4;
  if (rest === 1) out.push("full");
  if (rest === 2) out.push("big", "tall");
  if (rest === 3) out.push("big", "small", "small");
  return out;
}

const CURTAINS = ["blue", "sand", "ink", "sand"] as const;
const SIZES: Record<Cell, string> = {
  big: "(max-width: 900px) 62vw, (max-width: 1400px) 31vw, 440px",
  wide: "(max-width: 900px) 62vw, (max-width: 1400px) 31vw, 440px",
  small: "(max-width: 900px) 32vw, (max-width: 1400px) 16vw, 220px",
  tall: "(max-width: 900px) 32vw, (max-width: 1400px) 16vw, 220px",
  full: "(max-width: 900px) 92vw, 46vw",
};

function MosaicPhoto({
  photo,
  i,
  cell,
}: {
  photo: PhotoData;
  i: number;
  cell: Cell;
}) {
  const img = <Photo photo={photo} className="ab-ph" sizes={SIZES[cell]} />;
  return (
    <div className={`ab-cell ab-cell--${cell} frame`}>
      {cell === "wide" ? (
        <Parallax className="ab-pic" strength={0.08}>
          {img}
        </Parallax>
      ) : (
        <Curtain
          className="ab-pic"
          color={CURTAINS[i % CURTAINS.length]}
          delay={(i % 4) * 0.12}
        >
          {img}
        </Curtain>
      )}
    </div>
  );
}

export default async function AboutPage() {
  const content = await getSiteContent();
  const { about, locations } = content;
  const photos = about.photos;
  const cells = bento(photos.length);
  const hasHistory = about.timeline.length > 0;

  return (
    <>
      <PageHero
        heading={about.heading}
        photo={about.heroPhoto}
        chips={locations.items.map((l) => ({
          icon: "pin" as const,
          text: l.name,
        }))}
      />

      <section className="section ab-story" aria-labelledby="ab-story-heading">
        <div className="wrap">
          <div
            className={
              photos.length > 0 ? "ab-story-grid" : "ab-story-grid is-text-only"
            }
          >
            <div className="ab-story-text">
              <Reveal className="sec-head">
                <span className="sec-no" aria-hidden="true">
                  01
                </span>
                <h2 id="ab-story-heading" className="grad-text">
                  {about.storyHeading}
                </h2>
              </Reveal>
              <Reveal className="ab-copy" delay={0.08}>
                {about.story.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </Reveal>
            </div>
            {photos.length > 0 && (
              <div className="ab-stage">
                <span className="glow-blob ab-blob" aria-hidden="true" />
                <span className="dots ab-dots" aria-hidden="true" />
                <div className="ab-mosaic">
                  {photos.map((p, i) => (
                    <MosaicPhoto
                      key={`${p.src}-${i}`}
                      photo={p}
                      i={i}
                      cell={cells[i]}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {hasHistory && (
        <section
          className="section bg-sand ab-history"
          aria-labelledby="ab-history-heading"
        >
          <div className="pg-decor" aria-hidden="true">
            <span className="dots ab-history-dots" />
            <span className="glow-blob ab-history-blob" />
          </div>
          <div className="wrap">
            <Reveal className="sec-head ab-history-head">
              <span className="sec-no" aria-hidden="true">
                02
              </span>
              <h2 id="ab-history-heading" className="grad-text">
                {about.historyHeading}
              </h2>
            </Reveal>
            <Stagger as="ol" className="ab-tl" gap={0.14}>
              {about.timeline.map((t, i) => (
                <StaggerItem
                  as="li"
                  key={`${t.year}-${i}`}
                  className="ab-tl-item"
                >
                  <span className="ab-tl-node" aria-hidden="true" />
                  <div className="ab-tl-card card lift">
                    <h3 className="ab-tl-year grad-text">{t.year}</h3>
                    <p className="ab-tl-text">{t.text}</p>
                  </div>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </section>
      )}

      <CtaBand
        content={content}
        heading={about.cta.heading}
        variant="reserve"
      />
    </>
  );
}
