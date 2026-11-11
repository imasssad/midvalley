// Creates an admin login, or resets one: `npm run admin:reset -- <email> [<name>]`.
//
// For when nobody can sign in to /admin (for example the only owner forgot their password). It edits
// auth/users.json in the same store the website uses (Vercel Blob when BLOB_READ_WRITE_TOKEN or BLOB_STORE_ID is
// set, in the shell or in .env.local; otherwise .data/), in the same format as lib/auth.ts:
//   - the email exists: a new password is set, the name is updated if one is given, the role is kept, and the
//     session version goes up, which signs that person out on every device. Their sign-in lockout is cleared.
//   - the email is new: an OWNER account is created (an owner can then manage everyone under People).
// The password is NEW_ADMIN_PASSWORD if that is set (at least 10 characters), otherwise a strong random one.
// It is printed once, here, and stored only as a bcrypt hash (12 rounds). Nothing else in the store changes.
//
// Note: once auth/users.json exists, ADMIN_EMAIL / ADMIN_PASSWORD are no longer used for the first sign-in.
import { createHash, randomInt } from "node:crypto";
import bcrypt from "bcryptjs";
import { blobHint, loadEnv, openStorage, toJSON, UsageError } from "./seed.mjs";

const USERS_PATH = "auth/users.json";
const BCRYPT_ROUNDS = 12; // lib/auth.ts
const MIN_PASSWORD = 10; // lib/auth.ts
const MAX_PASSWORD = 200; // app/admin/actions.ts hashes at most 200 characters

/** Same rules as lib/auth.ts normalizeEmail and the People page's email check. */
const normalizeEmail = (v) => String(v ?? "").trim().toLowerCase().slice(0, 200);
const validEmail = (email) => /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email);
/** Same cleaning as the People page (app/admin/actions.ts addUser). */
const cleanName = (v) => String(v ?? "").replace(/[\u0000-\u001F\u007F<>]/g, "").trim().slice(0, 80);

/** "eric.smith@example.com" -> "Eric" (same as lib/auth.ts nameFromEmail). */
function nameFromEmail(email) {
  const first = email.split("@")[0].split(/[._+-]/)[0] || "Owner";
  return first.charAt(0).toUpperCase() + first.slice(1);
}

/** 24 random characters without look-alikes (no 0/O, 1/l/I), in groups of 4: about 137 bits. Easy to type, hard to guess. */
function randomPassword() {
  const alphabet = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const chars = Array.from({ length: 24 }, () => alphabet[randomInt(alphabet.length)]);
  return chars.join("").match(/.{4}/g).join("-");
}

/** lib/auth.ts attemptsPath: the failed sign-in counter for an email. */
const attemptsPath = (email) => `auth/attempts/${createHash("sha256").update(email).digest("hex")}.json`;

async function main() {
  const args = process.argv.slice(2);
  const positional = args.filter((a, i) => !a.startsWith("--") && args[i - 1] !== "--env");
  if (args.includes("--help") || args.includes("-h") || positional.length === 0) {
    console.log(
      "Usage: npm run admin:reset -- <email> [<name>] [--env <file>]\n" +
        "  Creates an owner login for <email>, or gives an existing login a new password (signing it out everywhere).\n" +
        "  The password is NEW_ADMIN_PASSWORD if set, otherwise a random one printed once.\n" +
        '  Names with spaces need quotes: npm run admin:reset -- eric@example.com "Eric Smith"',
    );
    if (positional.length === 0 && !args.includes("--help") && !args.includes("-h")) process.exit(2);
    return;
  }
  const unknown = args.filter((a, i) => a.startsWith("--") && a !== "--env" && args[i - 1] !== "--env");
  if (unknown.length) throw new UsageError(`Unknown option(s): ${unknown.join(" ")}. Try --help.`);
  if (positional.length > 2) throw new UsageError('Too many arguments. Put a name with spaces in quotes: "Eric Smith".');

  const email = normalizeEmail(positional[0]);
  if (!validEmail(email)) throw new UsageError(`"${positional[0]}" isn't a full email address.`);
  const givenName = positional[1] === undefined ? undefined : cleanName(positional[1]);
  if (positional[1] !== undefined && !givenName) throw new UsageError("The name is empty after removing unsupported characters.");

  await loadEnv(args);
  const fromEnv = process.env.NEW_ADMIN_PASSWORD;
  let password;
  if (fromEnv !== undefined && fromEnv !== "") {
    if (fromEnv.length < MIN_PASSWORD) throw new UsageError(`NEW_ADMIN_PASSWORD must be at least ${MIN_PASSWORD} characters.`);
    if (fromEnv.length > MAX_PASSWORD) throw new UsageError(`NEW_ADMIN_PASSWORD must be at most ${MAX_PASSWORD} characters.`);
    password = fromEnv;
  } else {
    password = randomPassword();
  }

  if (!(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID) && process.env.VERCEL) {
    throw new Error("Running on Vercel without a Blob store: connect one in Vercel > Storage first.");
  }
  const store = await openStorage();
  console.log(`Storage:  ${store.describe}`);

  const text = await store.readText(USERS_PATH);
  let users = [];
  if (text !== null) {
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(`${USERS_PATH} in storage is not valid JSON, so it was left untouched. Fix or delete it first.`);
    }
    if (!data || !Array.isArray(data.users)) {
      throw new Error(`${USERS_PATH} in storage doesn't look like a users file ({ "users": [...] }), so it was left untouched.`);
    }
    users = data.users;
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const existing = users.find((u) => u.email === email);
  let summary;
  if (existing) {
    existing.passwordHash = passwordHash;
    existing.sv = (Number.isInteger(existing.sv) ? existing.sv : 0) + 1; // signs them out everywhere (lib/auth.ts)
    if (givenName) existing.name = givenName;
    summary = `RESET    ${existing.name} <${email}> (${existing.role}): new password; signed out on every device.`;
  } else {
    const user = {
      email,
      name: givenName || nameFromEmail(email),
      role: "owner",
      passwordHash,
      sv: 1,
      createdAt: new Date().toISOString(),
    };
    users.push(user);
    summary = `CREATED  ${user.name} <${email}> as an owner.${text === null ? " (This is the first login; ADMIN_EMAIL / ADMIN_PASSWORD are no longer used.)" : ""}`;
  }

  await store.writeText(USERS_PATH, toJSON({ users }));
  console.log(summary);
  // A reset should work straight away, even if the email was locked after too many wrong passwords.
  try {
    await store.remove(attemptsPath(email));
  } catch {
    console.log("         (Couldn't clear a sign-in lockout for this email; if there is one, it ends within 15 minutes.)");
  }

  if (fromEnv) {
    console.log("Password: the one in NEW_ADMIN_PASSWORD (not printed). Remove that variable from your shell or .env.local now.");
  } else {
    console.log("\nNew password (shown only this once, copy it now):\n");
    console.log(`    ${password}\n`);
    console.log("Sign in at /admin with it, then change it under Your account.");
  }
}

main().catch((err) => {
  if (err instanceof UsageError) {
    console.error(`Error: ${err.message}`);
    process.exit(2);
  }
  console.error(`\nadmin:reset failed: ${err?.message ?? err}`);
  const hint = blobHint(err);
  if (hint) console.error(`Hint: ${hint}`);
  console.error("Nothing was changed unless a line above says so.");
  process.exit(1);
});
