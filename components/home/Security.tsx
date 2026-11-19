// "Security", right after Facility Features, on white. A split, mirrored from Facility Features: left, the security
// photo, tall and rounded with a soft blue glow (.frame), over a glow blob and an offset dot-grid panel, with a
// white glass chip (shield + the photo label, e.g. "Video Surveillance") on its bottom edge; right, the section
// pill, the heading in navy-to-blue gradient text, the text as a lede, then up to three glossy stat tiles (the
// number or short word big in condensed gradient text, its meaning under it). Stacked from 900px down (text
// first); the tiles stay three across down to 680px, then stack.
// Every word and the photo come from content.home.security. Renders nothing while switched off.
// Motion: heading and text rise in (Reveal), the photo block slides in from the left and its photo moves with
// parallax (±7%), the chip floats in after it, the tiles pop in one after another (PopGroup/PopItem).
import { Icon } from "@/components/Icon";
import { Parallax } from "@/components/motion/Parallax";
import { Reveal } from "@/components/motion/Reveal";
import { Photo } from "@/components/Photo";
import type { SiteContent } from "@/lib/content-schema";
import { PopGroup, PopItem } from "./Pop";
import { showSecurity } from "./sectionNumbers";

export function Security({ content, no }: { content: SiteContent; no: string }) {
  if (!showSecurity(content)) return null;
  const { security } = content.home;
  return (
    <section id="security" className="section bg-bone h-sec" aria-labelledby="home-security-heading">
      <span className="glow-blob h-sec-blob" aria-hidden="true" />
      <div className="wrap h-layer h-sec-grid">
        <div className="h-sec-stage">
          <span className="dots h-sec-dots" aria-hidden="true" />
          <Reveal className="h-sec-media" from="left" delay={0.1}>
            <div className="frame h-sec-frame">
              <Parallax className="h-sec-photo" strength={0.07}>
                <Photo photo={security.photo} className="h-fill h-zoom" sizes="(max-width: 900px) 92vw, (max-width: 1500px) 44vw, 640px" />
              </Parallax>
            </div>
          </Reveal>
          {security.photoLabel && (
            <PopGroup className="h-sec-float" delay={0.45}>
              <PopItem className="chip h-sec-chip" from={{ x: 24, y: 8 }}>
                <span className="chip-dot" aria-hidden="true">
                  <Icon name="shield" size={15} />
                </span>
                {security.photoLabel}
              </PopItem>
            </PopGroup>
          )}
        </div>
        <div className="h-sec-text">
          <Reveal className="sec-head">
            <span className="sec-no" aria-hidden="true">
              {no}
            </span>
            <h2 id="home-security-heading" className="grad-text">
              {security.heading}
            </h2>
          </Reveal>
          <Reveal delay={0.08}>
            <p className="lede">{security.text}</p>
          </Reveal>
          {security.stats.length > 0 && (
            <PopGroup as="ul" className="h-sec-stats" gap={0.12} delay={0.15}>
              {security.stats.map((s, i) => (
                <PopItem as="li" className="h-sec-stat-item" key={`${i}-${s.value}`}>
                  <div className="card h-sec-stat">
                    <strong className="h-sec-value grad-text">{s.value}</strong>
                    <span className="h-sec-label">{s.label}</span>
                  </div>
                </PopItem>
              ))}
            </PopGroup>
          )}
        </div>
      </div>
    </section>
  );
}
