// "About Mid Valley Storage": the homepage's one h1, the welcome copy and the large lobby photo.
// Two columns on desktop (text + photo), stacked from 900px down.
import { Photo } from "@/components/Photo";
import type { SiteContent } from "@/lib/content-schema";

export function AboutIntro({ content }: { content: SiteContent }) {
  const { about } = content.home;
  return (
    <section id="about" className="section home-about" aria-labelledby="home-about-heading">
      <div className="wrap">
        <div className="about-head" data-reveal>
          <p className="eyebrow">{about.eyebrow}</p>
          <h1 id="home-about-heading">{about.heading}</h1>
        </div>
        <div className="about-grid">
          <div className="about-text" data-reveal>
            {about.paragraphs.map((p, i) => (
              <p key={i} className={i === 0 ? "lede" : undefined}>
                {p}
              </p>
            ))}
          </div>
          <div className="about-media" data-reveal style={{ "--reveal-delay": "120ms" } as React.CSSProperties}>
            <Photo photo={about.photo} className="about-photo" sizes="(max-width: 900px) 92vw, (max-width: 1380px) 50vw, 680px" />
          </div>
        </div>
      </div>
    </section>
  );
}
