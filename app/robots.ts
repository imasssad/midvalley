// /robots.txt: crawl everything except the API, and point to the sitemap. The Employee Portal is NOT blocked here:
// it carries a noindex meta tag, and crawlers must be able to fetch the page to see it.
import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/links";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/"] },
    sitemap: new URL("/sitemap.xml", SITE_URL).toString(),
  };
}
