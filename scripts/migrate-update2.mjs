// Update 2 (client answers, Nov 20): office hours, gate hours and three photo changes, applied to the STORED website content without
// touching anything else the owner has edited. `npm run migrate:update2` (add `-- --dry-run` to only show what would
// change, `-- --env <file>` to load another env file). Same store as the website and `npm run seed`.
//
// Only these fields, for the two locations (noble, santa-fe), and only where the owner hasn't set them already:
//   - officeHours: set when empty (it was hidden until now). A value typed in the admin panel is kept (and reported).
//   - gateHours:   set when it is still the earlier text "6AM to 8PM". Anything else (also empty) is kept.
//   - home.about.photo: the sharper office photo (security.jpg, 2592px) replaces lobby.jpg (1600px), only while the
//     photo is exactly as shipped (file, description and focus). Anything changed in the admin panel is kept.
//   - home.security.photo: so the homepage doesn't show the same photo twice, the Security section gets the gate
//     keypad photo (keycode-access.jpg), only while it is exactly as shipped and the About photo is now security.jpg;
//     its chip label "Video Surveillance" (unchanged only) becomes "Individual Keycode Access" to match the photo.
//   - about.photos: the client asked to remove rss.jpg (the wide facility view) from the About Us gallery. Only that
//     photo is removed; the others and their order are kept.
// Before writing, the stored content is saved as a history version (admin: "Change history & undo"). Running it a
// second time finds nothing to change and writes nothing. Do NOT use `npm run seed -- --force` for this.
//
// The live site caches content for up to an hour: the change shows within the hour, or right away after the next
// admin save or a redeploy.
import { promises as fs } from "node:fs";
import path from "node:path";
import { blobHint, loadEnv, openStorage, ROOT, toJSON, UsageError } from "./seed.mjs";

const CONTENT_PATH = "content/site.json";
const MARKER = "migrations/update2.json";
const HISTORY_PREFIX = "content/history/";
const BY = { email: "migration", name: "Update 2 migration" };
const NOTE = "Before Update 2 (npm run migrate:update2)";
const LOCATION_IDS = ["noble", "santa-fe"];
const OLD_GATE_HOURS = "6AM to 8PM";

/** Applies the hours to a copy of `stored`, using the repository defaults as the new values. */
export function applyUpdate2(stored, defaults) {
  const doc = structuredClone(stored);
  const changed = [];
  const kept = [];
  applyPhotos(doc, defaults, changed, kept);
  const items = doc.locations?.items;
  if (!Array.isArray(items)) {
    kept.push("locations: none stored (the repository defaults, which already have the hours, apply)");
    return { doc, changed, kept };
  }
  for (const id of LOCATION_IDS) {
    const want = defaults.locations.items.find((l) => l.id === id);
    const item = items.find((l) => l?.id === id);
    if (!want || !item) {
      kept.push(`locations.${id}: not stored, nothing set`);
      continue;
    }
    const office = String(item.officeHours ?? "").trim();
    if (!office) {
      changed.push(`locations.${id}.officeHours: (empty) -> "${want.officeHours}"`);
      item.officeHours = want.officeHours;
    } else if (office !== want.officeHours) {
      kept.push(`locations.${id}.officeHours: set in the admin panel ("${office}"), left as it is`);
    }
    const gate = String(item.gateHours ?? "").trim();
    if (gate === OLD_GATE_HOURS) {
      changed.push(`locations.${id}.gateHours: "${gate}" -> "${want.gateHours}"`);
      item.gateHours = want.gateHours;
    } else if (gate !== want.gateHours) {
      kept.push(`locations.${id}.gateHours: set in the admin panel ("${gate}"), left as it is`);
    }
  }
  return { doc, changed, kept };
}

const isObject = (v) => typeof v === "object" && v !== null && !Array.isArray(v);
/** The two homepage photos exactly as shipped before Update 2. */
const OLD_ABOUT = {
  src: "/images/lobby.jpg",
  alt: "Mid Valley Storage office lobby with the service counter, a wall of security camera screens and moving supplies",
  focus: "50% 50%",
};
const OLD_SECURITY = { src: "/images/security.jpg", alt: "Office service desk below a wall of security camera monitors", focus: "50% 50%" };
/** Same file, description and focus (width/height/original only exist on uploads, which never match these). */
const samePhoto = (p, q) =>
  isObject(p) && p.src === q.src && (p.alt ?? "") === q.alt && (p.focus ?? "50% 50%") === q.focus && !p.original;
const REMOVED_GALLERY_PHOTO = "/images/rss.jpg";
const OLD_SECURITY_LABEL = "Video Surveillance";

/** The three photo changes (in place). */
function applyPhotos(doc, defaults, changed, kept) {
  const home = isObject(doc.home) ? doc.home : null;
  const about = home && isObject(home.about) ? home.about : null;
  const security = home && isObject(home.security) ? home.security : null;
  const wantAbout = defaults.home.about.photo;
  const wantSecurity = defaults.home.security.photo;

  // A photo is swapped only while it is exactly as shipped (file, description and focus): if the owner changed any
  // of them in the admin panel, it is left alone and reported.
  if (about && isObject(about.photo)) {
    if (samePhoto(about.photo, OLD_ABOUT)) {
      changed.push(`home.about.photo: ${OLD_ABOUT.src} -> ${wantAbout.src} (sharper)`);
      about.photo = structuredClone(wantAbout);
    } else if (!samePhoto(about.photo, wantAbout)) {
      kept.push(`home.about.photo: changed in the admin panel (${about.photo.src}), left as it is. Swap it there if wanted.`);
    }
  }
  if (security && isObject(security.photo)) {
    const aboutNow = about && isObject(about.photo) ? about.photo.src : null;
    if (samePhoto(security.photo, OLD_SECURITY) && aboutNow === OLD_SECURITY.src) {
      changed.push(`home.security.photo: ${OLD_SECURITY.src} -> ${wantSecurity.src} (so the homepage doesn't repeat a photo)`);
      security.photo = structuredClone(wantSecurity);
      // The chip on the photo names what it shows: the old label fitted the camera monitors, not the keypad.
      if (security.photoLabel === OLD_SECURITY_LABEL) {
        changed.push(`home.security.photoLabel: "${OLD_SECURITY_LABEL}" -> "${defaults.home.security.photoLabel}"`);
        security.photoLabel = defaults.home.security.photoLabel;
      } else if (security.photoLabel && security.photoLabel !== defaults.home.security.photoLabel) {
        kept.push(`home.security.photoLabel: set in the admin panel ("${security.photoLabel}"), left as it is. Check it fits the new keypad photo.`);
      }
    } else if (!samePhoto(security.photo, wantSecurity) && !samePhoto(security.photo, OLD_SECURITY)) {
      kept.push(`home.security.photo: changed in the admin panel (${security.photo.src}), left as it is`);
    }
  }
  const gallery = isObject(doc.about) && Array.isArray(doc.about.photos) ? doc.about.photos : null;
  if (gallery && gallery.some((p) => isObject(p) && p.src === REMOVED_GALLERY_PHOTO)) {
    doc.about.photos = gallery.filter((p) => !(isObject(p) && p.src === REMOVED_GALLERY_PHOTO));
    changed.push(`about.photos: removed ${REMOVED_GALLERY_PHOTO} (${gallery.length} -> ${doc.about.photos.length} photos)`);
  }
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes("--help") || args.includes("-h")) {
    console.log("Usage: npm run migrate:update2 [-- --dry-run] [-- --once] [-- --env <file>]\n  --once  skip when this store already recorded a run (used by the production build)");
    return;
  }
  const unknown = args.filter((a, i) => !["--dry-run", "--once", "--env"].includes(a) && args[i - 1] !== "--env");
  if (unknown.length) throw new UsageError(`Unknown option(s): ${unknown.join(" ")}. Try --help.`);
  const dryRun = args.includes("--dry-run");

  await loadEnv(args);
  const store = await openStorage();
  console.log(`Storage:  ${store.describe}${dryRun ? "\nMode:     --dry-run (nothing is written)" : ""}\n`);

  // Run-once record (migrations/update2.json in the store). With --once, a store that already has it is left alone,
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
    console.log(`SKIPPED  ${CONTENT_PATH}: nothing is stored, so the site uses the repository defaults, which already hold the hours.`);
  } else {
    let stored;
    try {
      stored = JSON.parse(storedText);
    } catch {
      throw new Error(`The stored ${CONTENT_PATH} is not valid JSON, so it was left untouched.`);
    }
    if (!isObject(stored)) throw new Error(`The stored ${CONTENT_PATH} is not a content document, so it was left untouched.`);
    const { doc, changed, kept } = applyUpdate2(stored, defaults);
    for (const line of kept) console.log(`KEPT     ${line}`);
    if (!changed.length) {
      console.log(`SKIPPED  ${CONTENT_PATH}: already up to date, nothing to change.`);
    } else if (dryRun) {
      for (const line of changed) console.log(`WOULD    ${line}`);
    } else {
      const savedAt = new Date().toISOString();
      const history = `${HISTORY_PREFIX}${savedAt.replace(/[:.]/g, "-")}.json`;
      await store.writeText(history, toJSON({ savedAt, savedBy: BY, section: "restore", note: NOTE, content: stored }));
      console.log(`SAVED    the stored content as a history version first: ${history}`);
      await store.writeText(CONTENT_PATH, toJSON(doc));
      for (const line of changed) console.log(`UPDATED  ${line}`);
    }
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
