// "About Mid Valley Storage" on mist, right after the value strip so the homepage's ONE h1 is its first section
// heading. A layered split. Left: the section pill (number + the small caps label), the h1 in navy-to-blue
// gradient text, the first paragraph as a lede and the rest as body text. Right: the lobby photo, tall (4:5; 4:3
// on phones), rounded with a soft blue glow (.frame), on top of a soft glow blob and an offset dot-grid panel,
// with three glass chips (real Facility Features items) overlapping its edges (on phones they sit in a row
// overlapping the photo's bottom edge).
// Stacked from 900px down (text first).
// Motion: the text blocks rise in one after another (Reveal, 0 / .1s), the photo block slides in from the right
// (Reveal), the photo drifts slower than the page while it crosses the screen (Parallax, ±8%) and zooms a touch
// on hover (CSS), and the chips float in one after another from the sides (PopGroup/PopItem).
import { Icon } from "@/components/Icon";
import { Parallax } from "@/components/motion/Parallax";
import { Reveal } from "@/components/motion/Reveal";
import { Photo } from "@/components/Photo";
import type { SiteContent } from "@/lib/content-schema";
import { pickItems } from "./pickItems";
import { PopGroup, PopItem } from "./Pop";

/** Facility Features items shown as chips on the photo when the list still has them. */
const CHIP_ITEMS = ["No Deposits Required", "Month-to-Month Rentals", "Video Surveillance"];
const CHIP_FROM = [{ x: -28, y: 0 }, { x: 28, y: 0 }, { x: -20, y: 10 }];

export function AboutIntro({ content, no }: { content: SiteContent; no: string }) {
  const { about, features } = content.home;
  const [first, ...rest] = about.paragraphs;
  const chips = pickItems(features.list, CHIP_ITEMS, 3);
  return (
    <section id="about" className="section bg-sand h-about" aria-labelledby="home-about-heading">
      <div className="wrap h-about-grid">
        <div className="h-about-text">
          <Reveal className="sec-head h-about-head">
            <p className="sec-no h-about-eyebrow">
              <span aria-hidden="true">{no}</span>
              {about.eyebrow}
            </p>
            <h1 id="home-about-heading" className="grad-text">
              {about.heading}
            </h1>
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
        <div className="h-about-stage">
          <span className="glow-blob h-about-blob" aria-hidden="true" />
          <span className="dots h-about-dots" aria-hidden="true" />
          <Reveal className="h-about-media" from="right" delay={0.15}>
            <div className="frame h-about-frame">
              <Parallax className="h-about-photo">
                <Photo photo={about.photo} className="h-fill h-zoom" sizes="(max-width: 900px) 92vw, (max-width: 1500px) 44vw, 620px" />
              </Parallax>
            </div>
          </Reveal>
          {chips.length > 0 && (
            <PopGroup as="ul" className="h-about-chips" gap={0.16} delay={0.45}>
              {chips.map((c, i) => (
                <PopItem as="li" className={`chip h-about-chip h-about-chip-${i + 1}`} key={c} from={CHIP_FROM[i]}>
                  <span className="chip-dot" aria-hidden="true">
                    <Icon name="check" size={15} />
                  </span>
                  {c}
                </PopItem>
              ))}
            </PopGroup>
          )}
        </div>
      </div>
    </section>
  );
}
