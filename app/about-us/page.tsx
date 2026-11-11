// About Us (/about-us, same URL as the old site): title band, "Our Story" with the story text and a photo
// mosaic (the old page used a slider), "Our History" timeline, and the closing "Reserve at <location>" band.
// Every word and photo comes from the editable content (content.about).
import type { Metadata } from "next";
import { CtaBand } from "@/components/CtaBand";
import { PageHero } from "@/components/PageHero";
import { Photo } from "@/components/Photo";
import { getSiteContent } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata("about", "/about-us");
}

/** `sizes` for each mosaic cell: the tall first photo and the wide last one need bigger files than the rest. */
function photoSizes(i: number, count: number, mosaic: boolean): string {
  if (mosaic && i === 0) return "(max-width: 900px) 70vw, (max-width: 1380px) 40vw, 560px";
  if (mosaic && i === count - 1 && count % 2 === 0) return "(max-width: 900px) 92vw, (max-width: 1380px) 55vw, 720px";
  return "(max-width: 900px) 46vw, (max-width: 1380px) 28vw, 380px";
}

export default async function AboutPage() {
  const content = await getSiteContent();
  const { about } = content;
  // Three or more photos get the mosaic (first photo tall); fewer just sit in a simple grid.
  const mosaic = about.photos.length >= 3;

  return (
    <>
      <PageHero heading={about.heading} photo={about.heroPhoto} />

      <section className="section ab-story" aria-labelledby="ab-story-heading">
        <div className="wrap ab-story-grid">
          <div className="ab-story-text" data-reveal>
            <h2 id="ab-story-heading">{about.storyHeading}</h2>
            {about.story.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
          {about.photos.length > 0 && (
            <div className={mosaic ? "ab-photos is-mosaic" : "ab-photos"}>
              {about.photos.map((photo, i) => (
                <div
                  key={`${photo.src}-${i}`}
                  className="ab-photo-cell"
                  data-reveal
                  style={{ "--reveal-delay": `${Math.min(i, 4) * 90}ms` } as React.CSSProperties}
                >
                  <Photo
                    photo={photo}
                    className="ab-photo"
                    sizes={photoSizes(i, about.photos.length, mosaic)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {about.timeline.length > 0 && (
        <section className="section section-cream ab-history" aria-labelledby="ab-history-heading">
          <div className="wrap">
            <h2 id="ab-history-heading" data-reveal>
              {about.historyHeading}
            </h2>
            <ol className="timeline">
              {about.timeline.map((t, i) => (
                <li
                  key={`${t.year}-${i}`}
                  className="tl-item"
                  data-reveal
                  style={{ "--reveal-delay": `${Math.min(i, 4) * 110}ms` } as React.CSSProperties}
                >
                  <h3 className="tl-year">{t.year}</h3>
                  <p className="tl-text">{t.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}

      <CtaBand content={content} heading={about.cta.heading} variant="reserve" />
    </>
  );
}
