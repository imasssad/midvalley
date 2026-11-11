import type { NextConfig } from "next";
// Phase 1 scrape: every photo of the old WordPress site, with the URLs it was served at and its new local copy.
// Imported with a relative path: the "@/" alias is not available while Next loads this file.
import imageMapJson from "./content/image-map.json";

const isDev = process.env.NODE_ENV === "development";

/* ---------------------------------------------------------------------------------------------------------------
   Redirects (old WordPress URLs -> new site). All are 301 (statusCode: 301), as on the old site; `permanent: true`
   would send 308. How Next matches a `source` (node_modules/next/dist/lib/redirect-status.js, modifyRouteRegex):
   - case-insensitive, and anchored at both ends;
   - an optional trailing slash is accepted after every source, so "/service" also catches "/service/" (one hop);
   - "/_next" is never matched by a redirect.
   Anything not listed here and not a page of this site gets the 404 page. In particular, no rule may catch
   /wp-admin, /wp-login.php, /wp-json, or /wp-content paths other than the exact photo URLs below: those must 404.
   http -> https and www -> bare domain are NOT done here: Vercel's domain settings do them (www.midvalleystorage.com
   set to redirect to midvalleystorage.com with 301; Vercel always upgrades http to https).
   --------------------------------------------------------------------------------------------------------------- */

type ImageMapEntry = { local: string; downloaded_from?: string; also_seen_as?: string[] };
const OLD_ORIGIN = /^https?:\/\/(www\.)?midvalleystorage\.com/i;

/** Escapes the characters that path-to-regexp treats as special, so a file name is matched literally. */
const literal = (path: string) => path.replace(/[(){}:*+?\\]/g, (c) => `\\${c}`);

/** Old /wp-content/uploads photo URLs (as Google may have indexed them) -> the matching photo in /images. Only
 *  the exact known paths from content/image-map.json: every other /wp-content URL stays a 404. */
function photoRedirects() {
  const seen = new Set<string>();
  const rules: { source: string; destination: string; statusCode: 301 }[] = [];
  for (const entry of imageMapJson as ImageMapEntry[]) {
    const urls = [entry.downloaded_from, ...(entry.also_seen_as ?? [])];
    for (const url of urls) {
      if (!url || !OLD_ORIGIN.test(url) || !entry.local.startsWith("/")) continue;
      const path = url.replace(OLD_ORIGIN, "").split(/[?#]/)[0];
      if (!path.startsWith("/wp-content/uploads/") || seen.has(path.toLowerCase())) continue;
      seen.add(path.toLowerCase());
      rules.push({ source: literal(path), destination: entry.local, statusCode: 301 });
    }
  }
  return rules;
}

/** First path segments that never get the trailing-slash redirect (they 404 or are handled by their own code). */
const NO_SLASH_REDIRECT = ["wp-admin", "wp-json", "wp-login\\.php", "wp-content", "_next", "api"];

/* ---------------------------------------------------------------------------------------------------------------
   Content-Security-Policy, for every route. It allows exactly what the site uses:
   - script-src 'unsafe-inline': Next's own inline scripts (the RSC payload and bootstrap), the layout's boot script
     (html.js class), JSON-LD and the GTM loader are inline. With Cache Components the pages are prerendered and
     cached; a nonce would have to be read per request (headers()), which would force every page to render
     dynamically and lose the static shell, so nonces are not used. Hosts: Google Tag Manager and Analytics.
     'unsafe-eval' is added in development only (React uses eval there for its debugging stacks; never in
     production).
   - img-src: our own photos (/images, /media), data:/blob: (admin upload previews), GTM/GA pixels, Google Maps
     tiles, and public Vercel Blob URLs.
   - media-src: the hero video (served by this site) and blob: previews in the admin panel.
   - connect-src: GA/GTM beacons, and the admin photo upload (client upload goes to vercel.com/api/blob, presigned
     uploads to *.blob.vercel-storage.com).
   - frame-src: the Google Maps embeds on the contact page (content/site.json mapEmbedUrl is maps.google.com/maps?
     ...&output=embed, which may redirect to www.google.com/maps/embed: both hosts are allowed), the Google Calendar
     on the employee page and GTM's no-JavaScript iframe. 'self' is added for the admin panel's live preview iframe
     (/admin/preview), which is on this site.
   - The Storedge rental center (rental-center.storedge.com) and QuikStor (ecom.quikstor.com) are plain links that
     open in a new tab. CSP does not limit navigation, so they need no entry here.
   If tags are added in Google Tag Manager later (for example Google Ads or a chat widget), their hosts must be
   added here, or the browser will block them (the console names the blocked host).
   --------------------------------------------------------------------------------------------------------------- */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://www.googletagmanager.com https://www.google-analytics.com https://ssl.google-analytics.com`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://www.googletagmanager.com https://www.google-analytics.com https://*.google-analytics.com https://maps.gstatic.com https://maps.googleapis.com https://*.public.blob.vercel-storage.com",
  "font-src 'self' data:",
  "media-src 'self' blob:",
  "connect-src 'self' https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com https://vercel.com https://*.blob.vercel-storage.com https://blob.vercel-storage.com",
  "frame-src 'self' https://www.google.com https://maps.google.com https://calendar.google.com https://www.googletagmanager.com",
  "frame-ancestors 'self'",
  "form-action 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  // Not in development: some browsers (Safari) would upgrade http://localhost requests to https and break them.
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  // Browsers ignore this header over plain http (localhost), so it is safe to send everywhere.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Cache Components (same as rapidselfstorage): pages read content through a cached, tagged function.
  cacheComponents: true,
  images: {
    // Photos shipped with the site (/images) and, from Phase 3, photos uploaded in the admin panel (/media).
    localPatterns: [
      { pathname: "/images/**", search: "" },
      { pathname: "/media/**", search: "" },
    ],
    formats: ["image/avif", "image/webp"],
    qualities: [60, 75, 85],
  },
  // Next's own trailing-slash redirect answers 308. It is turned off so the rules below can answer 301 (and leave
  // /wp-admin, /api, ... alone). This does not change the URLs that <Link> generates (trailingSlash stays false).
  skipTrailingSlashRedirect: true,
  async redirects() {
    const to = (source: string, destination: string) => ({ source, destination, statusCode: 301 as const });
    return [
      // The old pages, with the trailing slash WordPress used.
      to("/about-us/", "/about-us"),
      to("/facilityfeatures/", "/facilityfeatures"),
      to("/contact/", "/contact"),
      to("/employee/", "/employee"),
      // Leftovers of the old theme (each also matches with a trailing slash).
      to("/404-2", "/"),
      to("/jet-popup/request-popup", "/"),
      to("/service", "/"),
      to("/service/:slug", "/"),
      to("/author", "/"),
      to("/author/:slug", "/"),
      // Photos at their old WordPress URLs.
      ...photoRedirects(),
      // Any other path ending in "/" -> the same path without it (one or more trailing slashes), except under the
      // prefixes in NO_SLASH_REDIRECT. "/" itself is not matched (the path must have a segment).
      to(`/:path((?!(?:${NO_SLASH_REDIRECT.join("|")})(?:/|$)).*[^/])/`, "/:path"),
    ];
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // The Employee Portal: never indexed and never stored by browsers or shared caches (the page is also
      // rendered per request once someone is signed in, see app/(site)/employee/page.tsx).
      {
        source: "/employee",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          { key: "Cache-Control", value: "private, no-store" },
        ],
      },
    ];
  },
};

export default nextConfig;
