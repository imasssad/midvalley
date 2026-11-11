// Facility Features (/facilityfeatures, same URL as the old site): title band, a short in-page index made of the
// feature titles (wraps onto several lines on phones, no sideways scrolling), then each feature as heading + text +
// photo in alternating rows (side by side down to tablets, stacked with the photo first on phones), and the
// closing "Reserve at <location>" band. Every word and photo comes from content.features.
import type { Metadata } from "next";
import { CtaBand } from "@/components/CtaBand";
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
            <ul className="ff-index-list">
              {features.items.map((f, i) => (
                <li key={ids[i]}>
                  <a href={`#${ids[i]}`}>{f.title}</a>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      )}

      <div className="section ff-list">
        <div className="wrap">
          {features.items.map((f, i) => (
            <section key={ids[i]} id={ids[i]} className="ff-item" aria-labelledby={`${ids[i]}-heading`}>
              <div className="ff-media" data-reveal>
                <Photo
                  photo={f.photo}
                  className="ff-photo"
                  sizes="(max-width: 680px) 92vw, (max-width: 1380px) 48vw, 660px"
                />
              </div>
              <div className="ff-text" data-reveal style={{ "--reveal-delay": "120ms" } as React.CSSProperties}>
                {/* Decorative running number ("03 / 08"), generated from the list, not copy. */}
                <p className="ff-num" aria-hidden="true">
                  {String(i + 1).padStart(2, "0")} <span>/ {total}</span>
                </p>
                <h2 id={`${ids[i]}-heading`}>{f.title}</h2>
                <p>{f.text}</p>
              </div>
            </section>
          ))}
        </div>
      </div>

      <CtaBand content={content} heading={features.cta.heading} variant="reserve" />
    </>
  );
}
