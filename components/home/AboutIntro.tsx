// "About Mid Valley Storage" on mist, right after the value strip so the homepage's ONE h1 is its first section
// heading. A layered split. Left: the section pill (number + the small caps label), the h1 in navy-to-blue
// gradient text, the first paragraph as a lede and the rest as body text. Right: the office photo in its own
// shape (uncropped), rounded with a soft blue glow (.frame), on top of a soft glow blob and an offset dot-grid panel,
// with three glass chips (real Facility Features items) overlapping its edges (on phones they sit in a row
// overlapping the photo's bottom edge).
// Stacked from 900px down (text first).
// Motion: the text blocks rise in one after another (Reveal, 0 / .1s), the photo block slides in from the right
// (Reveal), and the chips float in one after another from the sides (PopGroup/PopItem). The photo itself does
// not move or zoom, so it always shows at (or below) the size of the file the browser picked, and stays sharp.
import { Icon } from "@/components/Icon";
import { Reveal } from "@/components/motion/Reveal";
import { Photo } from "@/components/Photo";
import type { Photo as PhotoData, SiteContent } from "@/lib/content-schema";
import { pickItems } from "./pickItems";
import { PopGroup, PopItem } from "./Pop";

/** Width of the photo box in viewport pixels (the 0.9 page zoom above 680px included), so the browser picks a file
 *  at least as wide as the box at 1x and 2x. Measured: 360 → 328, 390 → 358, 820 → 761, 900 → 835, 901 → 371,
 *  1280 → 530, 1440 → 561 (the most it gets: the column stops growing there). */
const ABOUT_PHOTO_SIZES = "(max-width: 680px) calc(100vw - 32px), (max-width: 900px) 93vw, (max-width: 1360px) 42vw, 562px";

/** Shipped photos' pixel sizes (uploaded ones carry their own, measured when the upload was optimised). */
const KNOWN_SIZES: Record<string, { width: number; height: number }> = {
  "/images/lobby.jpg": { width: 1600, height: 984 },
  "/images/security.jpg": { width: 2592, height: 1944 },
};

function photoSize(photo: PhotoData) {
  return KNOWN_SIZES[photo.src] ?? (photo.width && photo.height ? { width: photo.width, height: photo.height } : null);
}

/** The photo's own shape (kept between square and 2:1 so the layout holds), 4:3 when unknown. */
function photoRatio(photo: PhotoData): string {
  const size = photoSize(photo);
  if (!size) return "4 / 3";
  const ratio = Math.min(2, Math.max(1, size.width / size.height));
  return String(Math.round(ratio * 1000) / 1000);
}

/** The box is never wider than half the file, so even on 2x screens the photo isn't drawn larger than it is. */
function photoMaxWidth(photo: PhotoData): string | undefined {
  const size = photoSize(photo);
  return size ? `${Math.floor(size.width / 2)}px` : undefined;
}

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
            {/* The box takes the photo's own shape, so the photo is shown whole (no crop) and never drawn larger
                than the file the browser picked: no parallax overscan and no hover zoom here (both enlarged it). */}
            <div className="frame h-about-frame" style={{ maxWidth: photoMaxWidth(about.photo), marginInline: "auto" }}>
              <div className="h-about-photo" style={{ aspectRatio: photoRatio(about.photo) }}>
                <Photo photo={about.photo} className="h-fill" quality={85} sizes={ABOUT_PHOTO_SIZES} />
              </div>
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
