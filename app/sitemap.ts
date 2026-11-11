// /sitemap.xml: the four public pages, at the same URLs as the old site (absolute, on SITE_URL: the bare domain
// https://midvalleystorage.com unless NEXT_PUBLIC_SITE_URL says otherwise). The Employee Portal and the admin
// panel are left out on purpose (also disallowed in app/robots.ts).
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
