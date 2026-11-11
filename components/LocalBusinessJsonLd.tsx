// Structured data for search engines: one schema.org "SelfStorage" business per location, built only from real
// content (no coordinates, opening hours or ratings: we don't have verified data for those).
import type { SiteContent } from "@/lib/content-schema";
import { phoneE164Dashed } from "@/lib/format";
import { SITE_URL } from "@/lib/links";

const absolute = (path: string) => new URL(path, SITE_URL).toString();

export function LocalBusinessJsonLd({ content }: { content: SiteContent }) {
  const { business, seo } = content;
  const site = absolute("/");
  const logo = absolute(business.logo.src);
  // The share image (also used for Open Graph), as an absolute URL.
  const image = seo.shareImage.src ? absolute(seo.shareImage.src) : logo;

  const graph = content.locations.items.map((l) => ({
    "@type": "SelfStorage",
    "@id": `${site}#${l.id}`,
    name: `${business.name} - ${l.name}`,
    url: site,
    // Undefined values are dropped by JSON.stringify.
    telephone: phoneE164Dashed(l.phone),
    address: {
      "@type": "PostalAddress",
      streetAddress: l.address.street,
      addressLocality: l.address.city,
      addressRegion: l.address.state,
      postalCode: l.address.zip,
      addressCountry: "US",
    },
    image,
    logo,
    sameAs: business.instagramUrl ? [business.instagramUrl] : undefined,
    hasMap: l.mapsUrl || undefined,
  }));

  // "<" escaped so content can never close the script tag.
  const json = JSON.stringify({ "@context": "https://schema.org", "@graph": graph }).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
