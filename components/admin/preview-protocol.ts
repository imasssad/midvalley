// Messages between an editor screen and its live preview frame (PreviewFrame ↔ PreviewCanvas). Same origin only.
import type { ScreenKey } from "@/lib/screens";

export type PreviewTarget = ScreenKey | "all";
export type PreviewZone = { screen: ScreenKey; part: string; top: number; height: number };
export type PreviewLayout = { height: number; zones: PreviewZone[] };

// Either side may load first, so both announce themselves: the frame sends `ready` when it starts, and the editor
// sends `hello` when it starts listening, which the frame answers with `ready`.
export const PREVIEW_MSG = {
  hello: "mvs-preview:hello",
  ready: "mvs-preview:ready",
  content: "mvs-preview:content",
  layout: "mvs-preview:layout",
} as const;

/** Which parts each screen's preview shows. Screens with an empty list have no preview. */
export const previewParts: Record<PreviewTarget, string[]> = {
  all: ["header", "hero", "valueStrip", "about", "locations", "storage", "features", "reviews", "cta", "footer"],
  banner: ["header", "hero"],
  locations: ["header", "locations", "footer"],
  home: ["valueStrip", "about", "locations", "storage", "features", "reviews", "cta"],
  about: ["aboutHero", "aboutCta"],
  features: ["featuresHero", "featuresCta"],
  contact: ["contactHero", "contactPage"],
  reviews: ["reviews"],
  header: ["header"],
  footer: ["footer"],
  labels: ["locations", "footer"],
  employee: [],
  seo: [],
};
