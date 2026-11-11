import type { NextConfig } from "next";

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
};

export default nextConfig;
