// Update 1 (client feedback): applies the new content to the STORED website content, without touching anything
// else the owner has edited in the admin panel. `npm run migrate:update1` (add `-- --dry-run` to only show what
// would change, `-- --env <file>` to load another env file).
//
// Uses the same store as the website and `npm run seed` (Vercel Blob when BLOB_READ_WRITE_TOKEN or BLOB_STORE_ID is
// set, in the shell or in .env.local; otherwise .data/). Do NOT use `npm run seed -- --force` for this: it would
// replace every admin edit with the repository defaults.
//
// Only these fields are changed, and only when they differ from the Update 1 values:
//   1. locations.items[noble | santa-fe].rentOnlineUrl (+ rentOnlineConfirmed): the Storedge "#/move-in" links.
//      The payment links ("#/login") are not touched.
//   2. hero.banner: the winter banner files (landscape for computers and tablets, portrait for phones) and its alt
//      text. hero.mode is not touched.
//   3. hero.disclaimer: the winter disclaimer.
//   4. hero.previousBanner: the summer banner, so "Restore previous banner" in the admin brings it back.
//   5. unitSizes: the client's three lists, but ONLY when nothing is stored there yet or the stored value is still
//      the earlier shipped default. A list the owner has edited is left alone (and reported).
//   5b. specials.text / specials.finePrint (the bar above the header): the client asked for "Buy up to" wording,
//      so the bar is changed to match the banner ONLY while it still holds the earlier shipped text. An edited bar
//      is left alone (and reported).
//   6. Saved history versions (content/history/, the admin's "Change history & undo"): only their Rent Online links
//      are set to the move-in links too, so undoing to an older version never brings the old reserve links back.
//      Nothing else in them changes. (The version saved by this run is written that way from the start.)
//   7. reference/ copies of the three scraped files Update 1 corrected (old reserve links; read-only reference data,
//      never shown to visitors) are refreshed from the repository when they differ from it.
// Before writing, the stored content is saved as a history version, so the admin panel's "Change history & undo"
// page can put it back. Running it a second time finds nothing to change and writes nothing.
//
// The live site caches content for up to an hour: the change shows within the hour, or right away after the next
// admin save or a redeploy.
import { promises as fs } from "node:fs";
import path from "node:path";
import { blobHint, loadEnv, openStorage, ROOT, toJSON, UsageError } from "./seed.mjs";

const CONTENT_PATH = "content/site.json";
const MARKER = "migrations/update1.json";
const HISTORY_PREFIX = "content/history/";
const BY = { email: "migration", name: "Update 1 migration" };
const NOTE = "Before Update 1 (npm run migrate:update1)";

const COMPANY = "ee6dd943-e3a5-49c9-af42-8bc54fe490cc";
const LOCATIONS = [
  { id: "noble", facilityId: "e398d43a-ce49-4691-b9af-8157e3883811" },
  { id: "santa-fe", facilityId: "165a4ac4-3327-4405-9927-412c59c08e0e" },
].map((l) => ({ ...l, moveIn: `https://rental-center.storedge.com?companyId=${COMPANY}&facilityId=${l.facilityId}#/move-in` }));

const landscape = {
  src: "/images/banner/winter-landscape-1536x1024.webp",
  alt: "",
  focus: "50% 50%",
  width: 1536,
  height: 1024,
  original: "/images/banner/winter-landscape-1536x1024.jpg",
};
const WINTER_BANNER = {
  desktop: landscape,
  tablet: landscape,
  mobile: {
    src: "/images/banner/winter-portrait-1024x1536.webp",
    alt: "",
    focus: "50% 50%",
    width: 1024,
    height: 1536,
    original: "/images/banner/winter-portrait-1024x1536.jpg",
  },
  alt: "Winter special: buy up to 4 months, get up to 4 months free at Mid Valley Storage. Limited time only, while supplies last. New customers only. Noble location only.",
};
const WINTER_DISCLAIMER = "*On select units. New customers only. Noble location only. Please visit office for full details.";

/** The summer banner as shipped, used when the stored content no longer holds it anywhere. */
const SUMMER = {
  banner: {
    desktop: { src: "/images/hero-promo-desktop.png", alt: "", focus: "50% 50%" },
    tablet: { src: "/images/hero-promo-tablet.png", alt: "", focus: "50% 50%" },
    mobile: { src: "/images/hero-promo-mobile.png", alt: "", focus: "50% 50%" },
    alt: "Sunsets, Summer, and Storage Specials. More space. More value. Right when you need it. 5x10 units $29.99 per month, 10x10 units $59.99 per month. Safe and secure, convenient location, month-to-month, clean and well maintained. Call us today at (559) 734-7368. Limited time only, while supplies last.",
  },
  disclaimer: "*Valid at Noble location only. New customers only. Please visit office for full details.",
};
const isSummer = (banner) => banner?.desktop?.src === SUMMER.banner.desktop.src;

/** The storage sizes shipped before Update 1 (replaced only if the stored value is still exactly this). */
const OLD_UNIT_SIZES = {
  enabled: true,
  heading: "Storage Sizes",
  groups: [
    {
      name: "Regular Storage",
      note: "",
      sizes: ["5x5", "5x7", "5x8", "5x10", "6x10", "9x10", "9x14", "10x5", "10x9", "10x10", "10x12", "10x12.5", "10x15", "10x30", "10x31", "10x33", "12x30", "12x40", "13x10", "15x30", "15x40", "15x50", "20x50"],
    },
    { name: "Parking", note: "", sizes: ["11x14", "11x21", "11x25", "11x30", "11x35", "11x40", "11x50"] },
    { name: "Climate Control", note: "", sizes: ["5x5", "5x10", "10x10"] },
  ],
};

/** The specials bar: the earlier shipped wording, and the Update 1 wording (same as the repository defaults). */
const OLD_SPECIALS = {
  text: "Winter Special: Rent 4 months, get up to 4 months free*",
  finePrint: "*On select units. New customers only. Noble location only.",
};

/** Scraped reference files whose old reserve links Update 1 replaced. */
const REFERENCE_FILES = ["content/pages/about-us.json", "content/pages/facilityfeatures.json", "content/inventory.json"];

// ---------------------------------------------------------------------------------------------------------------

/** Order-insensitive deep equality for JSON values (object key order doesn't matter, list order does). */
function same(a, b) {
  if (a === b) return true;
  if (typeof a !== typeof b || a === null || b === null || typeof a !== "object") return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a)) return a.length === b.length && a.every((v, i) => same(v, b[i]));
  const ka = Object.keys(a).filter((k) => a[k] !== undefined);
  const kb = Object.keys(b).filter((k) => b[k] !== undefined);
  return ka.length === kb.length && ka.every((k) => Object.hasOwn(b, k) && same(a[k], b[k]));
}

/** Sets the two locations' Rent Online links in a content document (in place). Returns the ids it changed. */
function setRentLinks(doc) {
  const items = doc?.locations?.items;
  const changed = [];
  if (!Array.isArray(items)) return changed;
  for (const loc of LOCATIONS) {
    const item = items.find((i) => i?.id === loc.id) ?? items.find((i) => String(i?.paymentUrl ?? "").includes(loc.facilityId));
    if (item && (item.rentOnlineUrl !== loc.moveIn || item.rentOnlineConfirmed !== true)) {
      changed.push({ id: item.id, from: item.rentOnlineUrl });
      item.rentOnlineUrl = loc.moveIn;
      item.rentOnlineConfirmed = true;
    }
  }
  return changed;
}

/** Applies the Update 1 values to a copy of `stored`. Returns the new document and a list of what changed / was kept. */
export function applyUpdate1(stored, defaults) {
  const doc = structuredClone(stored);
  const changed = [];
  const kept = [];

  // 1. Rent Online links.
  const items = doc.locations?.items;
  if (Array.isArray(items)) {
    for (const loc of LOCATIONS) {
      if (!items.some((i) => i?.id === loc.id || String(i?.paymentUrl ?? "").includes(loc.facilityId))) {
        kept.push(`locations: no "${loc.id}" location is stored, so its Rent Online link was not set`);
      }
    }
    for (const c of setRentLinks(doc)) {
      changed.push(`locations.${c.id}.rentOnlineUrl: ${c.from || "(empty)"} -> ${LOCATIONS.find((l) => l.id === c.id)?.moveIn ?? "move-in link"}`);
    }
  } else {
    kept.push("locations: none stored (the repository defaults, which already have the move-in links, apply)");
  }

  // 2-4. Winter banner, disclaimer, summer banner kept as the previous banner. hero.mode is left as it is.
  if (doc.hero && typeof doc.hero === "object") {
    const hero = doc.hero;
    // The summer banner, as the owner last had it: from the previous-banner slot or the live slot, else as shipped.
    const summer = isSummer(hero.previousBanner?.banner)
      ? { banner: hero.previousBanner.banner, disclaimer: hero.previousBanner.disclaimer ?? SUMMER.disclaimer }
      : isSummer(hero.banner)
        ? { banner: hero.banner, disclaimer: hero.disclaimer || SUMMER.disclaimer }
        : SUMMER;
    if (!same(hero.banner, WINTER_BANNER)) {
      const from = hero.banner?.desktop?.src ?? "(none)";
      if (from.startsWith("/media/")) kept.push(`hero.banner: the replaced banner (${from}) is in the history version saved first`);
      changed.push(`hero.banner: ${from} -> ${WINTER_BANNER.desktop.src} (phones: ${WINTER_BANNER.mobile.src}), new alt text`);
      hero.banner = structuredClone(WINTER_BANNER);
    }
    if (hero.disclaimer !== WINTER_DISCLAIMER) {
      changed.push(`hero.disclaimer: "${hero.disclaimer ?? ""}" -> "${WINTER_DISCLAIMER}"`);
      hero.disclaimer = WINTER_DISCLAIMER;
    }
    const prev = hero.previousBanner;
    if (!(prev && same(prev.banner, summer.banner) && prev.disclaimer === summer.disclaimer)) {
      changed.push("hero.previousBanner: set to the summer banner (admin: Restore previous banner)");
      hero.previousBanner = {
        banner: structuredClone(summer.banner),
        disclaimer: summer.disclaimer,
        replacedAt: prev?.replacedAt && isSummer(prev.banner) ? prev.replacedAt : new Date().toISOString(),
      };
    }
  } else {
    kept.push("hero: none stored (the repository defaults, which already have the winter banner, apply)");
  }

  // 5. Storage sizes: only when missing or still the earlier shipped default.
  if (doc.unitSizes === undefined || same(doc.unitSizes, OLD_UNIT_SIZES)) {
    if (!same(doc.unitSizes, defaults.unitSizes)) {
      changed.push(`unitSizes: ${doc.unitSizes === undefined ? "(none stored)" : "earlier default"} -> the client's lists (${defaults.unitSizes.groups.map((g) => `${g.name}: ${g.sizes.length}`).join(", ")})`);
      doc.unitSizes = structuredClone(defaults.unitSizes);
    }
  } else if (!same(doc.unitSizes, defaults.unitSizes)) {
    kept.push("unitSizes: edited in the admin panel, so it was left as it is (check it against the client's lists)");
  }

  // 5b. Specials bar wording: only when it is still exactly the earlier shipped text.
  const sp = doc.specials;
  if (sp && typeof sp === "object" && defaults.specials) {
    const want = { text: defaults.specials.text, finePrint: defaults.specials.finePrint };
    if (sp.text === OLD_SPECIALS.text && sp.finePrint === OLD_SPECIALS.finePrint) {
      changed.push(`specials: "${sp.text}" -> "${want.text}" (fine print: "${want.finePrint}")`);
      sp.text = want.text;
      sp.finePrint = want.finePrint;
    } else if (sp.text !== want.text || sp.finePrint !== want.finePrint) {
      kept.push(`specials: edited in the admin panel ("${sp.text}"), so it was left as it is`);
    }
  }

  return { doc, changed, kept };
}

/** Every stored path under `prefix` (the history folder). */
async function listPaths(store, prefix) {
  if (store.mode === "local") {
    const dir = path.join(ROOT, ".data", prefix);
    try {
      return (await fs.readdir(dir)).map((f) => prefix + f);
    } catch (err) {
      if (err.code === "ENOENT") return [];
      throw err;
    }
  }
  const { list } = await import("@vercel/blob");
  const out = [];
  let cursor;
  do {
    const page = await list({ prefix, cursor, limit: 1000 });
    out.push(...page.blobs.map((b) => b.pathname));
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return out;
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes("--help") || args.includes("-h")) {
    console.log("Usage: npm run migrate:update1 [-- --dry-run] [-- --once] [-- --env <file>]\n  --once  skip when this store already recorded a run (used by the production build)");
    return;
  }
  const unknown = args.filter((a, i) => !["--dry-run", "--once", "--env"].includes(a) && args[i - 1] !== "--env");
  if (unknown.length) throw new UsageError(`Unknown option(s): ${unknown.join(" ")}. Try --help.`);
  const dryRun = args.includes("--dry-run");

  await loadEnv(args);
  const store = await openStorage();
  console.log(`Storage:  ${store.describe}${dryRun ? "\nMode:     --dry-run (nothing is written)" : ""}\n`);

  // Run-once record (migrations/update1.json in the store). With --once, a store that already has it is left alone,
  // so the production build can call this on every deploy without ever undoing a later admin edit.
  const marker = await store.readText(MARKER);
  if (marker !== null && args.includes("--once")) {
    let at = "";
    try {
      at = JSON.parse(marker).ranAt ?? "";
    } catch {
      // an unreadable record still counts as "already run"
    }
    console.log(`SKIPPED  already applied to this store${at ? ` on ${at}` : ""} (${MARKER}). Nothing to do.`);
    return;
  }

  const defaults = JSON.parse(await fs.readFile(path.join(ROOT, CONTENT_PATH), "utf8"));
  const storedText = await store.readText(CONTENT_PATH);
  if (storedText === null) {
    console.log(`SKIPPED  ${CONTENT_PATH}: nothing is stored, so the site uses the repository defaults, which already hold the Update 1 values.`);
  } else {
    let stored;
    try {
      stored = JSON.parse(storedText);
    } catch {
      throw new Error(`The stored ${CONTENT_PATH} is not valid JSON, so it was left untouched.`);
    }
    const { doc, changed, kept } = applyUpdate1(stored, defaults);
    for (const line of kept) console.log(`KEPT     ${line}`);
    if (!changed.length) {
      console.log(`SKIPPED  ${CONTENT_PATH}: already up to date, nothing to change.`);
    } else if (dryRun) {
      for (const line of changed) console.log(`WOULD    ${line}`);
    } else {
      const savedAt = new Date().toISOString();
      const history = `${HISTORY_PREFIX}${savedAt.replace(/[:.]/g, "-")}.json`;
      const before = structuredClone(stored);
      setRentLinks(before); // so undoing to this version never brings the old reserve links back
      await store.writeText(history, toJSON({ savedAt, savedBy: BY, section: "restore", note: NOTE, content: before }));
      console.log(`SAVED    the stored content as a history version first: ${history}`);
      await store.writeText(CONTENT_PATH, toJSON(doc));
      for (const line of changed) console.log(`UPDATED  ${line}`);
    }
  }

  // 6. Rent Online links in saved history versions.
  const versions = (await listPaths(store, HISTORY_PREFIX)).filter((p) => p.endsWith(".json"));
  let fixed = 0;
  for (const file of versions) {
    const text = await store.readText(file);
    let entry;
    try {
      entry = JSON.parse(text ?? "");
    } catch {
      continue; // not a readable version: the admin panel skips it too
    }
    if (!entry?.content || setRentLinks(entry.content).length === 0) continue;
    fixed++;
    if (!dryRun) await store.writeText(file, toJSON(entry));
  }
  console.log(
    fixed
      ? `${dryRun ? "WOULD   " : "UPDATED "} Rent Online links in ${fixed} of ${versions.length} saved history version(s) (nothing else in them changed)`
      : `SKIPPED  history: all ${versions.length} saved version(s) already have the move-in links`,
  );

  // 7. Reference copies.
  for (const relative of REFERENCE_FILES) {
    const target = `reference/${relative.replace(/^content\//, "")}`;
    const current = await store.readText(target);
    const wanted = await fs.readFile(path.join(ROOT, relative), "utf8");
    if (current === null || current === wanted) continue;
    if (dryRun) {
      console.log(`WOULD    refresh ${target}`);
      continue;
    }
    await store.writeText(target, wanted);
    console.log(`UPDATED  ${target} (refreshed from the repository)`);
  }
  if (!dryRun) await store.writeText(MARKER, toJSON({ ranAt: new Date().toISOString(), by: BY.name }));
  console.log("\nDone. The live site shows the change within the hour, or right away after the next admin save or a redeploy.");
}

main().catch((err) => {
  if (err instanceof UsageError) {
    console.error(`Error: ${err.message}`);
    process.exit(2);
  }
  console.error(`\nMigration failed: ${err?.message ?? err}`);
  const hint = blobHint(err);
  if (hint) console.error(`Hint: ${hint}`);
  console.error("Only the steps printed above were done.");
  process.exit(1);
});
