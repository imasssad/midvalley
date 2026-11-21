// Runs the content migrations during a PRODUCTION build on Vercel (`npm run build` calls this first), so a deploy
// brings the saved content up to date without anyone running a command by hand.
//
// - Only when VERCEL_ENV is "production" and a Blob store is connected; local builds, preview builds and builds
//   without a store do nothing here.
// - Each migration runs with --once: it records itself in the store (migrations/<name>.json) and is skipped on every
//   later deploy, so it can never undo an edit made in the admin panel afterwards.
// - Each migration only changes values that are still exactly as shipped, and saves a history version first.
// - A failure is printed in the build log but does not stop the deploy (the site still works from what is stored);
//   the next deploy tries again, or run it by hand: `npm run migrate:update1` / `npm run migrate:update2`.
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const MIGRATIONS = ["migrate-update1.mjs", "migrate-update2.mjs"]; // in order

const here = path.dirname(fileURLToPath(import.meta.url));

if (process.env.VERCEL_ENV !== "production") {
  console.log(`Content migrations: skipped (not a production build${process.env.VERCEL_ENV ? `: ${process.env.VERCEL_ENV}` : ""}).`);
} else if (!process.env.BLOB_READ_WRITE_TOKEN && !process.env.BLOB_STORE_ID) {
  console.log("Content migrations: skipped (no Blob store is connected, so the site shows the repository defaults).");
} else {
  for (const script of MIGRATIONS) {
    console.log(`\n--- Content migration: ${script} (--once) ---`);
    const run = spawnSync(process.execPath, [path.join(here, script), "--once"], { stdio: "inherit", env: process.env });
    if (run.status !== 0) {
      console.warn(`WARNING: ${script} did not finish (exit ${run.status ?? run.signal}). The deploy continues; later migrations are skipped this time.`);
      break;
    }
  }
  console.log("");
}
