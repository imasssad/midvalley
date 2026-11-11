// Seeds the content store from the repository: `npm run seed` (or `npm run seed -- --force`).
//
// Where it writes: the same place the website reads. A private Vercel Blob store when BLOB_READ_WRITE_TOKEN or
// BLOB_STORE_ID is set (in the shell, or in .env.local, which is loaded if present; `--env <file>` loads another
// file), otherwise the same paths under ./.data/ (local development). Same rules as lib/storage.ts.
//
// What it does with the website content (content/site.json in storage):
//   - nothing stored yet  -> writes the repository defaults (content/site.json) and records a history version.
//   - something stored    -> keeps every stored value (the owner's edits always win) and only ADDS fields that
//                            exist in the repository defaults but not in the stored document (fields added to the
//                            site later). Lists are kept exactly as stored. Writes only if something was added.
//   - --force             -> first records the stored document as a history version, then replaces it with the
//                            repository defaults (and records that too). The admin panel's "Change history & undo"
//                            page can put the previous version back.
// It also copies the Phase 1 reference data (content/pages/*.json, content/image-map.json, content/inventory.json)
// to reference/ in storage. Those files are read-only reference material and are never served to visitors.
//
// Running it twice in a row changes nothing the second time. Nothing is deleted or overwritten without --force.
// Plain Node (ESM), no TypeScript and no Next.js, so it runs anywhere `npm install` has been run.
//
// The live site caches content for up to an hour. An admin save refreshes it at once; this script can't, so after
// a --force run the change shows within the hour, or right away after the next admin save or a redeploy.
import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const CONTENT_PATH = "content/site.json";
const HISTORY_PREFIX = "content/history/";
const REFERENCE_PREFIX = "reference/";
const SEED_BY = { email: "seed", name: "Seed script" };

// ---------------------------------------------------------------------------------------------------------------
// Environment
// ---------------------------------------------------------------------------------------------------------------

/**
 * Loads KEY=VALUE lines from an env file into process.env without overriding variables that are already set.
 * Handles `export KEY=...`, comments, and single or double quotes (the format `vercel env pull` writes).
 * Returns the number of variables loaded; values are never printed.
 */
export async function loadEnvFile(file) {
  let text;
  try {
    text = await fs.readFile(file, "utf8");
  } catch (err) {
    if (err.code === "ENOENT") return null;
    throw err;
  }
  let count = 0;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const m = /^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(line);
    if (!m) continue;
    const [, key, rest] = m;
    let value = rest;
    const quote = value[0];
    if ((quote === '"' || quote === "'") && value.lastIndexOf(quote) > 0) {
      value = value.slice(1, value.lastIndexOf(quote));
      if (quote === '"') value = value.replace(/\\n/g, "\n").replace(/\\r/g, "\r").replace(/\\"/g, '"').replace(/\\\\/g, "\\");
    } else {
      value = value.replace(/\s+#.*$/, "").trim();
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
      count++;
    }
  }
  return count;
}

/** Loads `--env <file>` if given, else .env.local in the project folder if it exists. Prints which file, not values. */
export async function loadEnv(args) {
  const i = args.indexOf("--env");
  if (i !== -1) {
    const file = args[i + 1];
    if (!file || file.startsWith("--")) throw new UsageError("--env needs a file name, for example --env .env.production.local");
    const n = await loadEnvFile(path.resolve(process.cwd(), file));
    if (n === null) throw new UsageError(`Env file not found: ${file}`);
    console.log(`Settings: loaded ${n} variable(s) from ${file}`);
    return;
  }
  const n = await loadEnvFile(path.join(ROOT, ".env.local"));
  if (n !== null) console.log(`Settings: loaded ${n} variable(s) from .env.local`);
}

export class UsageError extends Error {}

// ---------------------------------------------------------------------------------------------------------------
// Storage (same backends and paths as lib/storage.ts)
// ---------------------------------------------------------------------------------------------------------------

const LOCAL_ROOT = path.join(ROOT, ".data");

function localPath(pathname) {
  const full = path.resolve(LOCAL_ROOT, pathname);
  if (!full.startsWith(LOCAL_ROOT + path.sep)) throw new Error(`Refusing path outside .data: ${pathname}`);
  return full;
}

/** Opens the store lib/storage.ts would use with the current environment. */
export async function openStorage() {
  const mode = process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID ? "blob" : "local";

  if (mode === "local") {
    return {
      mode,
      describe: `local folder ${path.relative(process.cwd(), LOCAL_ROOT) || ".data"}/ (no Blob settings found)`,
      async readText(pathname) {
        try {
          return await fs.readFile(localPath(pathname), "utf8");
        } catch (err) {
          if (err.code === "ENOENT") return null;
          throw err;
        }
      },
      async writeText(pathname, text) {
        const file = localPath(pathname);
        await fs.mkdir(path.dirname(file), { recursive: true });
        await fs.writeFile(file, text);
      },
      async remove(pathname) {
        await fs.rm(localPath(pathname), { force: true });
      },
    };
  }

  const { BlobNotFoundError, del, get, put } = await import("@vercel/blob");
  return {
    mode,
    describe: process.env.BLOB_READ_WRITE_TOKEN
      ? "private Vercel Blob store (BLOB_READ_WRITE_TOKEN)"
      : "private Vercel Blob store (BLOB_STORE_ID with a Vercel OIDC token)",
    async readText(pathname) {
      try {
        // useCache: false reads the newest version, never a CDN copy (same as lib/storage.ts for data files).
        const res = await get(pathname, { access: "private", useCache: false });
        if (!res || res.statusCode !== 200 || !res.stream) return null;
        return await new Response(res.stream).text();
      } catch (err) {
        if (err instanceof BlobNotFoundError) return null;
        throw err;
      }
    },
    async writeText(pathname, text) {
      await put(pathname, text, {
        access: "private",
        allowOverwrite: true,
        addRandomSuffix: false,
        contentType: pathname.endsWith(".json") ? "application/json" : "text/plain",
      });
    },
    async remove(pathname) {
      await del(pathname);
    },
  };
}

/** Same JSON formatting as lib/storage.ts writeJSON. */
export const toJSON = (data) => JSON.stringify(data, null, 2);

// ---------------------------------------------------------------------------------------------------------------
// Seed
// ---------------------------------------------------------------------------------------------------------------

const isPlainObject = (v) => typeof v === "object" && v !== null && !Array.isArray(v);

/**
 * Returns `stored` with every key that exists in `defaults` but not in `stored` added (recursively, objects only).
 * Stored values are never changed; lists are kept as stored; a stored value of another type than the default
 * (for example null where the default is an object) is kept as is. `added` collects the dotted paths added.
 */
function addMissing(stored, defaults, at, added) {
  const out = { ...stored };
  for (const [key, value] of Object.entries(defaults)) {
    const here = at ? `${at}.${key}` : key;
    if (!Object.hasOwn(stored, key)) {
      out[key] = structuredClone(value);
      added.push(here);
    } else if (isPlainObject(stored[key]) && isPlainObject(value)) {
      out[key] = addMissing(stored[key], value, here, added);
    }
  }
  return out;
}

let lastStamp = 0;
/** A history timestamp later than any this run has used, so two versions saved in one run never share a file. */
function nextSavedAt() {
  const now = Math.max(Date.now(), lastStamp + 1);
  lastStamp = now;
  return new Date(now).toISOString();
}

/** Same file name rule as lib/content.ts (historyPath), so the admin panel lists and restores these versions. */
const historyPath = (savedAt) => `${HISTORY_PREFIX}${savedAt.replace(/[:.]/g, "-")}.json`;

async function recordVersion(store, content, note) {
  const savedAt = nextSavedAt();
  const file = historyPath(savedAt);
  await store.writeText(file, toJSON({ savedAt, savedBy: SEED_BY, section: "restore", note, content }));
  return file;
}

async function readRepoJSON(relative) {
  const text = await fs.readFile(path.join(ROOT, relative), "utf8");
  try {
    return { text, data: JSON.parse(text) };
  } catch (err) {
    throw new Error(`${relative} in the repository is not valid JSON: ${err.message}`);
  }
}

async function seedContent(store, force, summary) {
  const { data: defaults } = await readRepoJSON("content/site.json");
  if (!isPlainObject(defaults) || defaults.version !== 1) {
    throw new Error('content/site.json in the repository is not a content document (expected an object with "version": 1).');
  }

  const storedText = await store.readText(CONTENT_PATH);

  // (1) Nothing stored yet: write the defaults.
  if (storedText === null) {
    await store.writeText(CONTENT_PATH, toJSON(defaults));
    const v = await recordVersion(store, defaults, "Imported from the repository (npm run seed)");
    summary.push(`WRITTEN  ${CONTENT_PATH}: nothing was stored yet, so the repository defaults were imported.`);
    summary.push(`         History version: ${v}`);
    return;
  }

  let stored;
  try {
    stored = JSON.parse(storedText);
  } catch {
    stored = undefined;
  }
  const storedOk = isPlainObject(stored);

  // (3) --force: snapshot what is stored, then replace it with the defaults.
  if (force) {
    if (storedOk) {
      const before = await recordVersion(store, stored, "Before npm run seed --force");
      summary.push(`SAVED    the stored content as a history version first: ${before}`);
    } else {
      // Not valid JSON, so it can't be a history version (the admin panel would skip it). Keep the bytes anyway.
      const copy = `content/unreadable-${nextSavedAt().replace(/[:.]/g, "-")}.json`;
      await store.writeText(copy, storedText);
      summary.push(`SAVED    the stored content was not valid JSON; a raw copy was kept at ${copy}`);
    }
    await store.writeText(CONTENT_PATH, toJSON(defaults));
    const v = await recordVersion(store, defaults, "Imported from the repository (npm run seed --force)");
    summary.push(`REPLACED ${CONTENT_PATH} with the repository defaults (--force).`);
    summary.push(`         History version: ${v}`);
    summary.push("         Undo: admin panel > Change history & undo > the version noted \"Before npm run seed --force\".");
    return;
  }

  if (!storedOk) {
    throw new Error(
      `The stored ${CONTENT_PATH} is not a valid content document, so it was left untouched. ` +
        "Check it in the Blob store (or .data/), or run with --force to keep a copy of it and import the repository defaults.",
    );
  }

  // (2) Stored content exists: only add what is missing.
  const added = [];
  const merged = addMissing(stored, defaults, "", added);
  if (added.length === 0) {
    summary.push(`SKIPPED  ${CONTENT_PATH}: Nothing to do (every field in the repository defaults is already stored; stored values kept).`);
    return;
  }
  await store.writeText(CONTENT_PATH, toJSON(merged));
  const shown = added.length > 40 ? [...added.slice(0, 40), `… and ${added.length - 40} more`] : added;
  const v = await recordVersion(store, merged, `Added new fields from the repository (npm run seed): ${shown.join(", ")}`);
  summary.push(`UPDATED  ${CONTENT_PATH}: added ${added.length} missing field(s) from the repository defaults; every stored value was kept.`);
  for (const p of added) summary.push(`         + ${p}`);
  summary.push(`         History version: ${v}`);
}

async function seedReference(store, summary) {
  const pagesDir = path.join(ROOT, "content/pages");
  const pages = (await fs.readdir(pagesDir)).filter((f) => f.endsWith(".json")).sort();
  const files = [...pages.map((f) => `content/pages/${f}`), "content/image-map.json", "content/inventory.json"];
  const written = [];
  const unchanged = [];
  for (const relative of files) {
    const { text } = await readRepoJSON(relative); // also checks it's valid JSON
    const target = REFERENCE_PREFIX + relative.replace(/^content\//, "");
    const current = await store.readText(target);
    if (current !== null && sameText(current, text)) {
      unchanged.push(target);
      continue;
    }
    await store.writeText(target, text);
    written.push(target);
  }
  if (written.length) summary.push(`WRITTEN  reference data (${written.length}): ${written.join(", ")}`);
  if (unchanged.length) summary.push(`SKIPPED  reference data already up to date (${unchanged.length}): ${unchanged.join(", ")}`);
}

const digest = (s) => createHash("sha256").update(s).digest("hex");
const sameText = (a, b) => digest(a) === digest(b);

export function blobHint(err) {
  const msg = String(err?.message ?? err);
  if (/No blob credentials|OIDC|oidc/i.test(msg) && process.env.BLOB_STORE_ID && !process.env.BLOB_READ_WRITE_TOKEN) {
    return "BLOB_STORE_ID is set but the Vercel OIDC token is missing or expired. Run `vercel env pull .env.local` again (the token lasts about 12 hours), or set BLOB_READ_WRITE_TOKEN instead.";
  }
  if (/fetch failed|ENOTFOUND|ECONNREFUSED|ETIMEDOUT/i.test(msg)) {
    return "Couldn't reach the Vercel Blob service. Check the internet connection, and that the Blob token is this project's (a token from `vercel env pull` names its store).";
  }
  if (/Access denied|token/i.test(msg)) return "Check that the Blob token belongs to this project's store and hasn't been rotated.";
  return null;
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes("--help") || args.includes("-h")) {
    console.log(
      "Usage: npm run seed [-- --force] [-- --env <file>]\n" +
        "  (no flag)  import the repository content if nothing is stored, else only add missing fields\n" +
        "  --force    snapshot the stored content to history, then replace it with the repository defaults\n" +
        "  --env F    load settings from F instead of .env.local",
    );
    return;
  }
  const unknown = args.filter((a, i) => !["--force", "--env"].includes(a) && args[i - 1] !== "--env");
  if (unknown.length) throw new UsageError(`Unknown option(s): ${unknown.join(" ")}. Try --help.`);
  const force = args.includes("--force");

  await loadEnv(args);
  if (!(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID) && process.env.VERCEL) {
    throw new Error("Running on Vercel without a Blob store: connect one in Vercel > Storage first.");
  }
  const store = await openStorage();
  console.log(`Storage:  ${store.describe}`);
  console.log(`Mode:     ${force ? "--force (replace the stored content with the repository defaults)" : "safe (only add what is missing)"}\n`);

  // Each line is printed as soon as that step is done, so a failure part-way shows exactly what was written.
  const summary = { push: (line) => console.log(line) };
  await seedContent(store, force, summary);
  await seedReference(store, summary);
  console.log("\nDone.");
}

// Run only when executed directly (scripts/reset-admin.mjs imports the helpers above).
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch((err) => {
    if (err instanceof UsageError) {
      console.error(`Error: ${err.message}`);
      process.exit(2);
    }
    console.error(`\nSeed failed: ${err?.message ?? err}`);
    const hint = blobHint(err);
    if (hint) console.error(`Hint: ${hint}`);
    console.error("Only the steps printed above were done; nothing else was changed.");
    process.exit(1);
  });
}
