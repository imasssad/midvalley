// Page titles, descriptions and Open Graph tags, all from the editable content (seo section).
// The descriptions in content/site.json are suggestions written for the rebuild, not client text.
import type { Metadata } from "next";
import { getSiteContent } from "./content";
import type { SiteContent } from "./content-schema";
import { SITE_URL } from "./links";

export type PageKey = Exclude<keyof SiteContent["seo"], "shareImage">;

export async function pageMetadata(key: PageKey, path: string, opts: { noindex?: boolean } = {}): Promise<Metadata> {
  const { seo, business } = await getSiteContent();
  const page = seo[key];
  // Size of the default share image (public/images/share.jpg), so link previews show it on the first share.
  const known = seo.shareImage.src === "/images/share.jpg" ? { width: 1200, height: 630, type: "image/jpeg" } : {};
  const image = { url: seo.shareImage.src, alt: seo.shareImage.alt, ...known };
  return {
    // Absolute: the titles in the content already carry the business name.
    title: { absolute: page.title },
    description: page.description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      url: new URL(path, SITE_URL).toString(),
      siteName: business.name,
      title: page.title,
      description: page.description,
      locale: "en_US",
      images: [image],
    },
    twitter: { card: "summary_large_image", title: page.title, description: page.description, images: [image.url] },
    robots: opts.noindex ? { index: false, follow: false } : undefined,
  };
}
