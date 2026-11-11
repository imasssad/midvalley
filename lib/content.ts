// Reading the website content. Phase 2 only reads; saving, history and uploads arrive with the admin panel in
// Phase 3 (same code as rapidselfstorage). Content saved by the admin panel lives at content/site.json in the
// Blob store (or .data/ locally) and wins over the defaults in the repository's content/site.json.
import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { sectionKeys, sectionSchemas, type SiteContent } from "./content-schema";
import { defaultContent } from "./site";
import { readJSON } from "./storage";

export const CONTENT_TAG = "site-content";
export const CONTENT_PATH = "content/site.json";

const isPlainObject = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

/** Stored values win; anything missing (for example a field added after the last save) comes from the defaults. */
function mergeDefaults(base: unknown, stored: unknown): unknown {
  if (isPlainObject(base) && isPlainObject(stored)) {
    const out: Record<string, unknown> = { ...base };
    for (const [k, v] of Object.entries(stored)) out[k] = k in base ? mergeDefaults(base[k], v) : v;
    return out;
  }
  return stored === undefined ? base : stored;
}

/** Turns whatever is stored into valid content, section by section, so one bad section never blanks the page. */
export function normalizeContent(raw: unknown): SiteContent {
  const stored = isPlainObject(raw) ? raw : {};
  const out = { version: 1 } as Record<string, unknown>;
  for (const key of sectionKeys) {
    const merged = mergeDefaults(defaultContent[key], stored[key]);
    const parsed = sectionSchemas[key].safeParse(merged);
    if (!parsed.success) console.error(`Stored "${key}" content is invalid; using defaults.`, parsed.error.issues);
    out[key] = parsed.success ? parsed.data : defaultContent[key];
  }
  return out as SiteContent;
}

/** Uncached read, for the contact form. */
export async function readContent(): Promise<SiteContent> {
  try {
    return normalizeContent(await readJSON(CONTENT_PATH));
  } catch (err) {
    console.error("Couldn't read website content; showing defaults.", err);
    return defaultContent;
  }
}

/** Cached read for the public pages. Admin saves (Phase 3) call updateTag(CONTENT_TAG), so edits show within seconds. */
export async function getSiteContent(): Promise<SiteContent> {
  "use cache";
  cacheLife("hours");
  cacheTag(CONTENT_TAG);
  return readContent();
}

/** The current year (for the footer copyright), cached so pages can still be prerendered. */
export async function getYear(): Promise<number> {
  "use cache";
  cacheLife("days");
  return new Date().getFullYear();
}
