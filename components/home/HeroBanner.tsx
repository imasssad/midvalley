// Top of the homepage, directly under the header: the monthly promo banner (the page's most important element),
// or, when the admin switches the hero to "video", the original header video. The banner is a real image that
// is never cropped: one file per screen size (art direction with <picture>), always width 100% / height auto.
// Under it, on a white ground with a soft dot grid and glow: the disclaimer and the "action dock" (a rounded white
// glass panel with Rent Online + Call for each location), so renting or calling is one tap away from the promo.
// Entrance (CSS, starts on first paint, no JavaScript): the banner fades in and settles from 96.5% to full size
// (.enter-banner, it only ever scales DOWN and nothing around it clips, so it always shows in full); then the dock
// panel rises in (.enter-rise --i 0) and its four buttons follow one after another (--i 1..4). Off with
// prefers-reduced-motion.
import { getImageProps } from "next/image";
import { Icon } from "@/components/Icon";
import { NewTabNote } from "@/components/NewTab";
import type { Photo, SiteContent } from "@/lib/content-schema";
import { phoneHref } from "@/lib/format";
import { externalLinkProps } from "@/lib/links";
import { HeroVideo } from "./HeroVideo";

type Size = { width: number; height: number };
type Slot = "desktop" | "tablet" | "mobile";

/** Pixel sizes of the banner files shipped with the site, so the browser reserves the right space (no layout shift). */
const KNOWN_SIZES: Record<string, Size> = {
  "/images/hero-promo-desktop.png": { width: 1774, height: 887 },
  "/images/hero-promo-tablet.png": { width: 1536, height: 1024 },
  "/images/hero-promo-mobile.png": { width: 864, height: 1821 },
};

/** Banners uploaded in the admin panel aren't measured yet: assume the usual shape for each slot (2:1, 3:2, tall
 *  portrait). The CSS (height: auto) still shows the real file uncropped; only the reserved space may differ. */
const SLOT_SIZES: Record<Slot, Size> = {
  desktop: { width: 1774, height: 887 },
  tablet: { width: 1536, height: 1024 },
  mobile: { width: 864, height: 1821 },
};

function bannerSize(photo: Photo, slot: Slot): Size {
  return KNOWN_SIZES[photo.src] ?? SLOT_SIZES[slot];
}

const rise = (i: number) => ({ "--i": i }) as React.CSSProperties;

/** The "action dock": a rounded white glass panel holding, per location, a small label (number pill + location
 *  name) and its orange Rent Online and white Call buttons. The panel rises in first, then the buttons one after
 *  another (.enter-rise with --i). Shown in image and video mode, always below the banner (never over it). */
function QuickActions({ content }: { content: SiteContent }) {
  const { locations, header, labels } = content;
  let n = 1;
  return (
    <div className="h-dock card enter-rise" style={rise(0)}>
      <div className="h-dock-groups">
        {locations.items.map((l, i) => (
          <div className="h-dock-group" key={l.id}>
            <p className="h-dock-loc">
              <span className="h-dock-no" aria-hidden="true">
                {String(i + 1).padStart(2, "0")}
              </span>
              <Icon name="pin" size={16} className="h-dock-pin" />
              {l.name}
            </p>
            <div className="h-quick-group">
              {/* PLACEHOLDER (to confirm): rentOnlineUrl is the old QuikStor reserve link until the client confirms it. */}
              {l.rentOnlineUrl && (
                <a
                  className="btn btn-cta h-quick-btn enter-rise"
                  style={rise(n++)}
                  href={l.rentOnlineUrl}
                  {...externalLinkProps(l.rentOnlineUrl)}
                >
                  <Icon name="key" />
                  {header.rentLabel}
                  <span className="sr-only">: {l.name}</span>
                  <NewTabNote text={labels.newTab} />
                </a>
              )}
              <a className="btn btn-line h-quick-btn enter-rise" style={rise(n++)} href={phoneHref(l.phone)}>
                <Icon name="phone" />
                {header.mobileCallWord} {l.phone}
                <span className="sr-only">: {l.name}</span>
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function HeroBanner({ content }: { content: SiteContent }) {
  const { hero } = content;

  // Video mode: decorative background video (no banner text, so no disclaimer either: it belongs to the promo).
  if (hero.mode === "video") {
    const { poster } = hero.video;
    // An optimized poster frame (about 1920px wide) instead of the full original photo.
    const posterSrc = getImageProps({ src: poster.src, alt: "", width: 960, height: 540, quality: 75 }).props.src;
    return (
      <div className="h-hero">
        <div className="h-video enter-banner" aria-hidden="true">
          <HeroVideo src={hero.video.src} poster={posterSrc} focus={poster.focus} />
        </div>
        <div className="h-quick">
          <div className="wrap">
            <QuickActions content={content} />
          </div>
        </div>
      </div>
    );
  }

  const { banner } = hero;
  const common = { alt: banner.alt, sizes: "100vw", quality: 85 } as const;
  const mobile = getImageProps({ ...common, src: banner.mobile.src, ...bannerSize(banner.mobile, "mobile") }).props;
  const tablet = getImageProps({ ...common, src: banner.tablet.src, ...bannerSize(banner.tablet, "tablet") }).props;
  // The desktop file is the <img> itself (and the fallback). It is the LCP element: load it first, right away.
  // No `preload` here: a preload link can't follow the <picture> media queries and would fetch the wrong file.
  const desktop = getImageProps({
    ...common,
    src: banner.desktop.src,
    ...bannerSize(banner.desktop, "desktop"),
    loading: "eager",
    fetchPriority: "high",
  }).props;

  return (
    <div className="h-hero">
      {/* The entrance class sits on this wrapper; nothing above it clips, so the banner is never cropped. */}
      <div className="h-banner-wrap enter-banner">
        <picture className="h-banner">
          {/* Portrait phone file up to 540px, the 3:2 tablet file 541-1100px, the 2:1 desktop file above. */}
          <source media="(max-width: 540px)" srcSet={mobile.srcSet} sizes="100vw" width={mobile.width} height={mobile.height} />
          <source media="(max-width: 1100px)" srcSet={tablet.srcSet} sizes="100vw" width={tablet.width} height={tablet.height} />
          {/* eslint-disable-next-line @next/next/no-img-element -- art direction: props come from getImageProps() */}
          <img {...desktop} alt={banner.alt} className="h-banner-img" style={{ ...desktop.style, width: "100%", height: "auto" }} />
        </picture>
      </div>
      <div className="h-quick">
        <div className="wrap">
          {hero.disclaimer && <p className="h-disclaimer">{hero.disclaimer}</p>}
          <QuickActions content={content} />
        </div>
      </div>
    </div>
  );
}
