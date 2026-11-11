// Title block at the top of the inner pages (About Us, Facility Features, Contact Us): a split block on a white to
// mist ground. Left: a decorative "/" index rule and the page's one h1 in huge condensed caps. Right (below the
// title on tablets and phones): the page's wide photo, rounded, on a soft blue glow (.frame).
// Above the fold, so the entrance is pure CSS (app/styles/pages.css) and starts on first paint: the h1 rises in,
// a navy curtain slides off the rounded photo while the photo settles from a slight zoom, then the glow fades in
// under it. Transform and opacity only; nothing animates with prefers-reduced-motion.
// No copy of its own: everything is passed in.
import type { Photo as PhotoData } from "@/lib/content-schema";
import { Photo } from "./Photo";

type Props = {
  heading: string;
  photo: PhotoData;
  /** Optional small label under the heading (from content). */
  eyebrow?: string;
  id?: string;
};

export function PageHero({ heading, photo, eyebrow, id = "page-title" }: Props) {
  return (
    <header className="ph" aria-labelledby={id}>
      <div className="wrap ph-grid">
        <div className="ph-title">
          {/* Decorative index rule (a slash and a hairline), not copy. */}
          <span className="sec-no ph-mark" aria-hidden="true">
            /
          </span>
          <h1 id={id} className="enter-rise" style={{ "--i": 0 } as React.CSSProperties}>
            {heading}
          </h1>
          {eyebrow && (
            <p className="ph-eyebrow enter-rise" style={{ "--i": 1 } as React.CSSProperties}>
              {eyebrow}
            </p>
          )}
        </div>
        <div className="ph-media frame">
          <div className="ph-pic">
            <Photo photo={photo} sizes="(max-width: 900px) 100vw, 50vw" className="ph-photo" eager />
            <span className="ph-cover" aria-hidden="true" />
          </div>
        </div>
      </div>
    </header>
  );
}
