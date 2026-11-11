// /robots.txt: crawl everything except the admin panel, the API and the Employee Portal (the client asked for
// /employee and /admin to be left out of search engines), and point to the sitemap.
// Both pages also send noindex themselves (app/employee/page.tsx metadata; app/admin/layout.tsx and proxy.ts's
// X-Robots-Tag). Trade-off: a crawler that obeys robots.txt never fetches a disallowed page, so it cannot see that
// noindex; if another website links to /employee, Google may still list the bare URL (no title or text). Nothing
// on the public site links to /admin, and /employee is linked only from the footer.
import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/links";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api/", "/employee"] },
    sitemap: new URL("/sitemap.xml", SITE_URL).toString(),
  };
}
