// The decorative section numbers of the homepage (01, 02...), in page order. A section that is switched off or
// empty gets no number and the ones after it move up, so the numbers never skip. Shared by the homepage
// (app/(site)/page.tsx) and the admin preview (components/admin/PreviewCanvas.tsx).
import type { SiteContent } from "@/lib/content-schema";
import { visibleSizeGroups } from "./UnitSizes";

/** The steps the website shows (a step needs a title), none while the section is switched off. */
export function visibleSteps(content: SiteContent) {
  const { steps } = content.home;
  if (!steps.enabled) return [];
  return steps.items.filter((s) => s.title.trim());
}

export function showSecurity(content: SiteContent): boolean {
  return content.home.security.enabled;
}

/** The questions the website shows, none while the section is switched off. */
export function visibleFaq(content: SiteContent) {
  const { faq } = content.home;
  if (!faq.enabled) return [];
  return faq.items.filter((f) => f.q.trim() && f.a.trim());
}

export type HomeNumbers = { about: string; locations: string; options: string; sizes: string; steps: string; features: string; security: string; faq: string; reviews: string };

export function homeNumbers(content: SiteContent): HomeNumbers {
  const order: [keyof HomeNumbers, boolean][] = [
    ["about", true],
    ["locations", true],
    ["options", true],
    ["sizes", visibleSizeGroups(content).length > 0],
    ["steps", visibleSteps(content).length > 0],
    ["features", true],
    ["security", showSecurity(content)],
    ["faq", visibleFaq(content).length > 0],
    ["reviews", content.testimonials.items.length > 0],
  ];
  const out = {} as HomeNumbers;
  let n = 0;
  for (const [key, shown] of order) {
    if (shown) n += 1;
    out[key] = String(shown ? n : n + 1).padStart(2, "0");
  }
  return out;
}
