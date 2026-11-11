// "Facility Features" as a full-bleed blue band: section number and heading (white), then the intro (sky) beside
// the boat photo on an offset orange block, then the 12-point checklist in 3 columns (2 on tablet, 1 on phone)
// with small square peach check marks. The photo is wide (16:10, 5:4 on phones) so the band stays compact.
// Motion: heading and intro rise in (Reveal), the photo block rises in and its photo moves with parallax (±7%),
// the checklist items come in one after another (Stagger, 0.05s apart).
import { Icon } from "@/components/Icon";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/Reveal";
import { Parallax } from "@/components/motion/Parallax";
import { Photo } from "@/components/Photo";
import type { SiteContent } from "@/lib/content-schema";

export function FeaturesList({ content, no }: { content: SiteContent; no: string }) {
  const { features } = content.home;
  return (
    <section id="features" className="section bg-blue h-features" aria-labelledby="home-features-heading">
      <div className="wrap">
        <Reveal className="sec-head">
          <span className="sec-no" aria-hidden="true">
            {no}
          </span>
          <h2 id="home-features-heading">{features.heading}</h2>
        </Reveal>
        <div className="h-features-top">
          <Reveal className="h-features-intro" delay={0.05}>
            <p className="lede">{features.intro}</p>
          </Reveal>
          <Reveal className="h-features-media" delay={0.15}>
            <div className="frame frame-orange">
              <Parallax className="h-features-photo" strength={0.07}>
                <Photo photo={features.photo} className="h-fill" sizes="(max-width: 680px) 92vw, (max-width: 1100px) 46vw, 760px" />
              </Parallax>
            </div>
          </Reveal>
        </div>
        <Stagger as="ul" className="h-checks" gap={0.05}>
          {features.list.map((item, i) => (
            <StaggerItem as="li" className="h-check" key={`${i}-${item}`}>
              <span className="h-check-mark" aria-hidden="true">
                <Icon name="check" size={14} />
              </span>
              {item}
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
