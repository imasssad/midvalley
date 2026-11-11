// "Facility Features": intro, the 12-point checklist (two columns) and the boat photo beside it. Cream section.
// The photo sits on the left on desktop; in the HTML the text comes first (better reading order).
import { Icon } from "@/components/Icon";
import { Photo } from "@/components/Photo";
import type { SiteContent } from "@/lib/content-schema";

export function FeaturesList({ content }: { content: SiteContent }) {
  const { features } = content.home;
  return (
    <section id="features" className="section section-cream home-features" aria-labelledby="home-features-heading">
      <div className="wrap features-grid">
        <div className="features-text" data-reveal>
          <h2 id="home-features-heading" className="home-heading">
            {features.heading}
          </h2>
          <p className="lede">{features.intro}</p>
          <ul className="checklist">
            {features.list.map((item, i) => (
              <li key={`${i}-${item}`}>
                <span className="check-mark">
                  <Icon name="check" size={14} />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="features-media" data-reveal style={{ "--reveal-delay": "120ms" } as React.CSSProperties}>
          <Photo photo={features.photo} className="features-photo" sizes="(max-width: 900px) 92vw, (max-width: 1380px) 44vw, 600px" />
        </div>
      </div>
    </section>
  );
}
