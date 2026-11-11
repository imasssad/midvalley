// Default website content: content/site.json, built in Phase 1 from the old WordPress site (no invented facts;
// every placeholder is marked there and in lib/content-schema.ts). Once the owner saves anything in the admin
// panel (Phase 3), the live content comes from the Blob store and missing fields fall back to these defaults.
import data from "@/content/site.json";
import { siteContentSchema, type SiteContent } from "./content-schema";

export const defaultContent: SiteContent = siteContentSchema.parse(data);
