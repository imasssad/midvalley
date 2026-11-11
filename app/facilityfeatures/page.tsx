// Facility Features (/facilityfeatures, same URL as the old site): split title block, an "On this page" index of
// rounded glossy chips (wraps onto several lines on phones, no sideways scrolling), then each feature as a
// full-width editorial row between hairline rules: a big blue running number, the h2 title, the text and the
// rounded photo on a soft blue glow. Photos alternate sides from 681px up and sit first, stacked, on phones. Then the closing
// "Reserve at <location>" band. Every word and photo comes from content.features.
// Motion: the chips come in one after another; in each row the text slides in from the side opposite the photo,
// and the photo moves with parallax (odd rows) or is uncovered by a sliding curtain (even rows).
import type { Metadata } from "next";
import { CtaBand } from "@/components/CtaBand";
import { Curtain } from "@/components/motion/Curtain";
import { Parallax } from "@/components/motion/Parallax";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/Reveal";
import { PageHero } from "@/components/PageHero";
import { Photo } from "@/components/Photo";
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

const SIZES = "(max-width: 680px) 92vw, (max-width: 1380px) 52vw, 720px";

export default async function FeaturesPage() {
  const content = await getSiteContent();
  const { features, labels } = content;
  const ids = anchorIds(features.items.map((f) => f.title));
  const total = String(features.items.length).padStart(2, "0");

  return (
    <>
      <PageHero heading={features.heading} photo={features.heroPhoto} />

      {features.items.length > 1 && (
        <nav className="ff-index" aria-label={labels.onThisPage}>
          <div className="wrap">
            <Stagger as="ul" className="ff-chips" gap={0.045}>
              {features.items.map((f, i) => (
                <StaggerItem as="li" key={ids[i]}>
                  <a className="ff-chip" href={`#${ids[i]}`}>
                    <span className="ff-chip-no" aria-hidden="true">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {f.title}
                  </a>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </nav>
      )}

      <div className="ff-list">
        <div className="wrap">
          {features.items.map((f, i) => {
            const odd = i % 2 === 0; // 1st, 3rd, 5th… row: photo on the left
            const img = <Photo photo={f.photo} className="ff-ph" sizes={SIZES} />;
            return (
              <section key={ids[i]} id={ids[i]} className="ff-row" aria-labelledby={`${ids[i]}-heading`}>
                <div className={odd ? "ff-media frame" : "ff-media frame frame-ink"}>
                  {odd ? (
                    <Parallax className="ff-pic" strength={0.08}>
                      {img}
                    </Parallax>
                  ) : (
                    <Curtain className="ff-pic" color="sand">
                      {img}
                    </Curtain>
                  )}
                </div>
                <Reveal className="ff-text" from={odd ? "right" : "left"} y={40} delay={0.08}>
                  {/* Decorative running number ("03 / 08"), generated from the list, not copy. */}
                  <p className="ff-no" aria-hidden="true">
                    <span className="ff-no-n">{String(i + 1).padStart(2, "0")}</span>
                    <span className="ff-of">/ {total}</span>
                  </p>
                  <h2 id={`${ids[i]}-heading`}>{f.title}</h2>
                  <p className="ff-body">{f.text}</p>
                </Reveal>
              </section>
            );
          })}
        </div>
      </div>

      <CtaBand content={content} heading={features.cta.heading} variant="reserve" />
    </>
  );
}
