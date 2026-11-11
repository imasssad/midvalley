// About Us (/about-us, same URL as the old site): split title block, "01 Our Story" as an editorial split (the
// story text beside an asymmetric two-column photo mosaic: the old page used a slider), "02 Our History" as a
// numbered timeline on sand, and the closing "Reserve at <location>" band.
// Motion: the section heads and story text rise in on scroll; each mosaic photo is uncovered by a sliding curtain
// (one moves with parallax instead); the timeline items come in one after another, so the connecting rule builds up
// segment by segment. Every word and photo comes from the editable content (content.about).
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

/** Offset colour block behind each mosaic photo, in turn. */
const FRAMES = ["frame", "frame frame-ink", "frame frame-sand", "frame"];
const CURTAINS = ["sand", "blue", "ink", "sand"] as const;
const MOSAIC_SIZES = "(max-width: 680px) 46vw, (max-width: 900px) 45vw, (max-width: 1380px) 24vw, 330px";

/** One mosaic cell. Cells alternate tall (4:5) and square, crossed between the two columns. */
function MosaicPhoto({ photo, i, single }: { photo: PhotoData; i: number; single: boolean }) {
  const col = i % 2;
  const row = Math.floor(i / 2);
  const shape = single ? "ab-pic--wide" : (col + row) % 2 === 0 ? "ab-pic--tall" : "ab-pic--square";
  const sizes = single ? "(max-width: 900px) 92vw, 46vw" : MOSAIC_SIZES;
  const img = <Photo photo={photo} className="ab-ph" sizes={sizes} />;
  return (
    <div className={`ab-cell ${FRAMES[i % FRAMES.length]}`}>
      {i % 4 === 3 ? (
        <Parallax className={`ab-pic ${shape}`} strength={0.07}>
          {img}
        </Parallax>
      ) : (
        <Curtain className={`ab-pic ${shape}`} color={CURTAINS[i % CURTAINS.length]} delay={col * 0.15}>
          {img}
        </Curtain>
      )}
    </div>
  );
}

export default async function AboutPage() {
  const content = await getSiteContent();
  const { about } = content;
  const photos = about.photos;
  // Two columns: photos 1, 3, 5… on the left, 2, 4, 6… on the right (pushed down for the asymmetric look).
  const cols = [photos.map((p, i) => ({ p, i })).filter((x) => x.i % 2 === 0), photos.map((p, i) => ({ p, i })).filter((x) => x.i % 2 === 1)];
  const single = photos.length === 1;

  return (
    <>
      <PageHero heading={about.heading} photo={about.heroPhoto} />

      <section className="section ab-story" aria-labelledby="ab-story-heading">
        <div className="wrap">
          <Reveal className="sec-head">
            <span className="sec-no" aria-hidden="true">
              01
            </span>
            <h2 id="ab-story-heading">{about.storyHeading}</h2>
          </Reveal>
          <div className={photos.length > 0 ? "ab-story-grid" : "ab-story-grid is-text-only"}>
            <Reveal className="ab-copy" delay={0.05}>
              {about.story.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </Reveal>
            {photos.length > 0 && (
              <div className={single ? "ab-mosaic is-single" : "ab-mosaic"}>
                {cols.map(
                  (col, c) =>
                    col.length > 0 && (
                      <div key={c} className="ab-col">
                        {col.map(({ p, i }) => (
                          <MosaicPhoto key={`${p.src}-${i}`} photo={p} i={i} single={single} />
                        ))}
                      </div>
                    ),
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {about.timeline.length > 0 && (
        <section className="section bg-sand ab-history" aria-labelledby="ab-history-heading">
          <div className="wrap">
            <Reveal className="sec-head">
              <span className="sec-no" aria-hidden="true">
                02
              </span>
              <h2 id="ab-history-heading">{about.historyHeading}</h2>
            </Reveal>
            <Stagger as="ol" className="ab-tl" gap={0.14}>
              {about.timeline.map((t, i) => (
                <StaggerItem as="li" key={`${t.year}-${i}`} className="ab-tl-item">
                  <h3 className="ab-tl-year" data-year={t.year}>
                    {t.year}
                  </h3>
                  <p className="ab-tl-text">{t.text}</p>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </section>
      )}

      <CtaBand content={content} heading={about.cta.heading} variant="reserve" />
    </>
  );
}
