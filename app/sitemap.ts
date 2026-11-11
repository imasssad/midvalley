// /sitemap.xml: the public pages, at the same URLs as the old site. The Employee Portal is left out on purpose.
import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/links";

const pages: { path: string; priority: number }[] = [
  { path: "/", priority: 1 },
  { path: "/about-us", priority: 0.7 },
  { path: "/facilityfeatures", priority: 0.8 },
  { path: "/contact", priority: 0.8 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return pages.map(({ path, priority }) => ({
    url: new URL(path, SITE_URL).toString(),
    changeFrequency: "monthly",
    priority,
  }));
}
