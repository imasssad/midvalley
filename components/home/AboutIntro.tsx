// "About Mid Valley Storage" on bone: a big split. Left: the small caps label, the homepage's ONE h1, the first
// paragraph as a lede and the rest as body text. Right: the lobby photo, tall (4:5; 4:3 on phones), on an offset
// blue block. Stacked from 900px down (text first).
// Motion: the text blocks rise in one after another (Reveal, 0 / .1s), the photo block slides in from the right
// (Reveal), and the photo drifts slower than the page while it crosses the screen (Parallax, ±8%).
import { Reveal } from "@/components/motion/Reveal";
import { Parallax } from "@/components/motion/Parallax";
import { Photo } from "@/components/Photo";
import type { SiteContent } from "@/lib/content-schema";

export function AboutIntro({ content, no }: { content: SiteContent; no: string }) {
  const { about } = content.home;
  const [first, ...rest] = about.paragraphs;
  return (
    <section id="about" className="section bg-bone h-about" aria-labelledby="home-about-heading">
      <div className="wrap h-about-grid">
        <div className="h-about-text">
          <Reveal className="h-about-head">
            <p className="h-eyebrow">
              <span className="h-eyebrow-no" aria-hidden="true">
                {no}
              </span>
              {about.eyebrow}
            </p>
            <h1 id="home-about-heading">{about.heading}</h1>
          </Reveal>
          {about.paragraphs.length > 0 && (
            <Reveal className="h-about-copy" delay={0.1}>
              <p className="lede">{first}</p>
              {rest.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </Reveal>
          )}
        </div>
        <Reveal className="h-about-media" from="right" delay={0.15}>
          <div className="frame">
            <Parallax className="h-about-photo">
              <Photo photo={about.photo} className="h-fill" sizes="(max-width: 900px) 92vw, (max-width: 1500px) 44vw, 620px" />
            </Parallax>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
