"use server";

// Every admin change goes through these Server Actions (ported from rapidselfstorage). Each one checks the session
// and role itself (never relying on proxy.ts alone); Next.js checks the Origin header of Server Action requests.
// Every content change is validated with the schema, saved with saveContent (which records a history entry) and
// followed by updateTag(CONTENT_TAG), so the live website shows it on the next visit, without a redeploy.
import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { BlobError } from "@vercel/blob";
import bcrypt from "bcryptjs";
import {
  AuthError,
  MIN_PASSWORD,
  SetupError,
  checkCredentials,
  clearFailures,
  endSession,
  hashPassword,
  loadUsers,
  lockoutMinutes,
  normalizeEmail,
  recordFailure,
  requireUserFor,
  saveUsers,
  signInSetupProblem,
  startSession,
  type Role,
  type StoredUser,
  type User,
} from "@/lib/auth";
import { CONTENT_TAG, listHistory, normalizeContent, readContent, readHistoryEntry, readHistoryPair, saveContent } from "@/lib/content";
import { fieldErrors, sectionSchemas, siteContentSchema, type SectionKey, type SiteContent } from "@/lib/content-schema";
import { changedPaths, getAt, sameValue, setAt, type Path } from "@/lib/diff";
import type { OptimizedPhoto } from "@/lib/media";
import { updateMessage } from "@/lib/messages";
import { blockedMinutes, clearHits, recordHit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/request-ip";
import { isScreenKey, screens } from "@/lib/screens";

/** `conflict`: someone else saved this part after it was opened (see saveScreen). */
type Failure = { ok: false; error: string; fieldErrors?: Record<string, string>; conflict?: boolean };
export type ActionResult = { ok: true; message?: string } | Failure;
/**
 * A saved screen returns the values as stored, so the editor shows exactly what the website now uses, and what
 * was stored just before (which "Undo this save" puts back, even if that was someone else's save). `also`: other
 * parts the server changed along with the save (the banner's "previous banner"), so the editor can show them.
 */
export type SaveResult = { ok: true; values: unknown[]; previous: unknown[]; also: { path: Path; value: unknown }[] } | Failure;
export type OptimizeResult = { ok: true; photo: OptimizedPhoto } | Failure;

const fail = (error: string, errors?: Record<string, string>): Failure => ({ ok: false, error, fieldErrors: errors });

async function guarded<T extends { ok: boolean }>(fn: () => Promise<T>): Promise<T | Failure> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof AuthError) return fail(err.message);
    console.error(err);
    return fail("Something went wrong and nothing was saved. Try again in a minute.");
  }
}

const by = (user: User) => ({ email: user.email, name: user.name });
const when = (iso: string) =>
  new Date(iso).toLocaleString("en-US", { timeZone: "America/Los_Angeles", dateStyle: "medium", timeStyle: "short" });

// ---- Signing in and out ----

const IP_BUCKET = "admin-login";
const IP_LIMIT = 20; // failed sign-ins per connection per 15 minutes, across all emails
const WINDOW_MS = 15 * 60 * 1000;

export async function login(_prev: { error?: string; email?: string } | undefined, formData: FormData): Promise<{ error?: string; email?: string }> {
  const typed = String(formData.get("email") ?? "").trim().slice(0, 254);
  const email = normalizeEmail(formData.get("email"));
  const password = String(formData.get("password") ?? "").slice(0, 200);
  // Every error hands the typed email back, so the form keeps it.
  const failed = (error: string) => ({ error, email: typed });
  const generic = failed("Email or password is incorrect.");
  if (!email || !password) return generic;

  // Name a missing setup step (no Blob store, no SESSION_SECRET…) instead of a vague failure.
  const problem = signInSetupProblem();
  if (problem) return failed(problem);

  try {
    const ip = await clientIp();
    const paused = Math.max(await lockoutMinutes(email), await blockedMinutes(IP_BUCKET, ip, IP_LIMIT, WINDOW_MS));
    if (paused) return failed(`Too many attempts. For your security, sign-in is paused for ${paused} minutes.`);

    const user = await checkCredentials(email, password);
    if (!user) {
      await recordHit(IP_BUCKET, ip, WINDOW_MS);
      const lockedNow = await recordFailure(email);
      return lockedNow ? failed(`Too many attempts. For your security, sign-in is paused for ${lockedNow} minutes.`) : generic;
    }
    await Promise.all([clearFailures(email), clearHits(IP_BUCKET, ip)]);
    await startSession(user);
  } catch (err) {
    console.error(err);
    if (err instanceof SetupError) return failed(err.message);
    if (err instanceof BlobError) {
      return failed(`The Blob store refused the request (${err.message}). Check that it's a Private store connected to this project, then redeploy.`);
    }
    return failed("Signing in isn't working right now. Try again in a minute.");
  }
  redirect("/admin");
}

export async function logout(): Promise<void> {
  await endSession();
  redirect("/admin/login");
}

// ---- Website content ----

/** Whether a change touched what the banner shows (images, description or small print). */
const bannerOf = (c: SiteContent) => ({ banner: c.hero.banner, disclaimer: c.hero.disclaimer });

/**
 * When `next` changes the banner, keep what it replaces in hero.previousBanner, so "Restore previous banner" can
 * put it back in one click. Returns the content to save.
 */
function keepPreviousBanner(current: SiteContent, next: SiteContent): SiteContent {
  if (sameValue(bannerOf(current), bannerOf(next))) return next;
  if (!sameValue(current.hero.previousBanner, next.hero.previousBanner)) return next; // the change set it itself
  return { ...next, hero: { ...next.hero, previousBanner: { ...bannerOf(current), replacedAt: new Date().toISOString() } } };
}

/** Validates the sections a change touched. Returns the cleaned content, or the errors by field ("hero.banner.alt"). */
function validateSections(next: SiteContent, keys: SectionKey[]): { content: SiteContent; errors: Record<string, string> } {
  let content = next;
  const errors: Record<string, string> = {};
  for (const key of keys) {
    const parsed = sectionSchemas[key].safeParse(next[key]);
    if (!parsed.success) {
      for (const [k, v] of Object.entries(fieldErrors(parsed.error))) errors[k ? `${key}.${k}` : key] = v;
    } else {
      content = { ...content, [key]: parsed.data };
    }
  }
  return { content, errors };
}

/** The latest save that touched any of these paths, for naming who saved in the way. */
async function latestSaveTouching(paths: readonly (readonly (string | number)[])[]) {
  const overlaps = (c: Path) => paths.some((s) => s.every((k, i) => c[i] === k) || c.every((k, i) => s[i] === k));
  return (await listHistory()).find((h) => h.changes?.some(overlaps));
}

async function conflictMessage(user: User, paths: readonly (readonly (string | number)[])[]): Promise<Failure> {
  const latest = await latestSaveTouching(paths);
  const mine = latest?.savedBy.email === user.email;
  const who = latest ? (mine ? "You" : latest.savedBy.name || latest.savedBy.email) : "Someone";
  return {
    ok: false,
    conflict: true,
    error: `${who} saved changes to this part of the website${latest ? ` at ${when(latest.savedAt)}` : ""}, after you opened it${mine ? " here" : ""}. Saving now would replace those changes.`,
  };
}

/**
 * Saves one admin screen. A screen edits fixed parts of the content (lib/screens.ts), so the browser only sends
 * the values for those parts, in order, and the server decides where they go. Everything else is kept as
 * currently stored, so two people editing different screens never overwrite each other. `base` is what those
 * parts held when the screen was opened: if someone else saved them since, the save stops and says so, unless
 * `force` (the person chose to replace the other version).
 */
export async function saveScreen(screen: string, values: unknown[], base?: unknown[], force = false): Promise<SaveResult> {
  return guarded(async (): Promise<SaveResult> => {
    if (!isScreenKey(screen)) return fail("That part of the website doesn't exist.");
    const def = screens[screen];
    const user = await requireUserFor(def.ownerOnly ? "owner" : "any");
    if (!Array.isArray(values) || values.length !== def.scopes.length) {
      return fail("Something went wrong and nothing was saved. Reload the page and try again.");
    }

    const current = await readContent();
    const previous = def.scopes.map((p) => getAt(current, p));
    if (!force && Array.isArray(base) && !sameValue(previous, base)) return conflictMessage(user, def.scopes);

    const merged = def.scopes.reduce((c, path, i) => setAt(c, path, values[i]), current);
    const touched = [...new Set(def.scopes.map((p) => p[0] as SectionKey))];
    const { content: clean, errors } = validateSections(merged, touched);
    if (Object.keys(errors).length) return fail("Some fields need attention. They're marked in red.", errors);

    const next = keepPreviousBanner(current, clean);
    const stored = def.scopes.map((p) => getAt(next, p));
    const also = sameValue(current.hero.previousBanner, next.hero.previousBanner)
      ? []
      : [{ path: ["hero", "previousBanner"], value: next.hero.previousBanner }];
    if (!changedPaths(current, next).length) return { ok: true, values: stored, previous, also };
    await saveContent(next, { by: by(user), section: screen, previous: current });
    updateTag(CONTENT_TAG);
    return { ok: true, values: stored, previous, also };
  });
}

/**
 * "Restore previous banner": swaps the banner (images, description, small print) with the one it replaced, and
 * saves. Pressing it again swaps back. `base` is the banner the editor shows; if someone changed it since, it stops.
 */
export async function restorePreviousBanner(base?: unknown): Promise<SaveResult> {
  return guarded(async (): Promise<SaveResult> => {
    const user = await requireUserFor("any");
    const def = screens.banner;
    const current = await readContent();
    const prev = current.hero.previousBanner;
    if (!prev) return fail("There's no previous banner to go back to yet. One is kept each time you save a new banner.");
    if (base !== undefined && !sameValue(base, bannerOf(current))) return conflictMessage(user, [["hero", "banner"], ["hero", "disclaimer"]]);

    const next: SiteContent = {
      ...current,
      hero: {
        ...current.hero,
        banner: prev.banner,
        disclaimer: prev.disclaimer,
        previousBanner: { ...bannerOf(current), replacedAt: new Date().toISOString() },
      },
    };
    const { content: clean, errors } = validateSections(next, ["hero"]);
    if (Object.keys(errors).length) return fail("The previous banner can't be used any more. Upload a new one instead.");
    const previous = def.scopes.map((p) => getAt(current, p));
    await saveContent(clean, {
      by: by(user),
      section: "banner",
      note: prev.replacedAt ? `Restored the banner used until ${when(prev.replacedAt)}` : "Restored the previous banner",
      previous: current,
    });
    updateTag(CONTENT_TAG);
    return { ok: true, values: def.scopes.map((p) => getAt(clean, p)), previous, also: [{ path: ["hero", "previousBanner"], value: clean.hero.previousBanner }] };
  });
}

/**
 * Makes the website copy of a photo the browser just uploaded: a WebP at most 2560px wide (lib/images.ts). The
 * original stays in storage. Returns the WebP's src, the original's src and its size in pixels.
 */
export async function optimizePhoto(original: string): Promise<OptimizeResult> {
  return guarded(async (): Promise<OptimizeResult> => {
    await requireUserFor("any");
    // Loaded only here, so signing in and saving text never wait for the image library.
    const { ImageError, optimizeUpload } = await import("@/lib/images");
    try {
      return { ok: true, photo: await optimizeUpload(String(original ?? "")) };
    } catch (err) {
      if (err instanceof ImageError) return fail(err.message);
      throw err;
    }
  });
}

// ---- History ----

export async function restoreVersion(id: string): Promise<ActionResult> {
  return guarded(async (): Promise<ActionResult> => {
    const user = await requireUserFor("any");
    const entry = await readHistoryEntry(String(id));
    if (!entry) return fail("That version is no longer available.");
    const restored = normalizeContent(entry.content); // fills in any fields added since that version was saved
    await saveContent(restored, { by: by(user), section: "restore", note: `Went back to the version from ${when(entry.savedAt)}` });
    updateTag(CONTENT_TAG);
    return { ok: true, message: `The website is back to how it was at ${when(entry.savedAt)}.` };
  });
}

/**
 * True when `path` in `current` still holds what the save left (`after`), and every list along the path still has
 * the same items in the same places: same length, and the same item at that position (by id, or else by everything
 * except the field being undone).
 */
function untouchedSince(current: unknown, after: unknown, path: Path): boolean {
  if (!sameValue(getAt(current, path), getAt(after, path))) return false;
  for (let i = 0; i < path.length; i++) {
    if (typeof path[i] !== "number") continue;
    const listNow = getAt(current, path.slice(0, i));
    const listThen = getAt(after, path.slice(0, i));
    if (!Array.isArray(listNow) || !Array.isArray(listThen) || listNow.length !== listThen.length) return false;
    const now = listNow[path[i] as number] as Record<string, unknown> | undefined;
    const then = listThen[path[i] as number] as Record<string, unknown> | undefined;
    if (now && then && typeof now === "object" && typeof then === "object" && "id" in then) {
      if (now.id !== then.id) return false;
    } else if (now && then && typeof now === "object" && typeof then === "object" && path[i + 1] !== undefined) {
      const { [path[i + 1] as string]: _n, ...restNow } = now;
      const { [path[i + 1] as string]: _t, ...restThen } = then;
      if (!sameValue(restNow, restThen)) return false;
    }
  }
  return true;
}

/** Each field a saved version changed, with what it held just before (from the version, or the one before it). */
function fieldsOf(pair: { entry: { changes?: Path[]; before?: unknown[]; content: unknown }; previous: { content: unknown } | null }) {
  const after = normalizeContent(pair.entry.content);
  if (pair.entry.changes && pair.entry.before && pair.entry.before.length === pair.entry.changes.length) {
    // Stored as JSON, so a field that didn't exist before (an optional photo) comes back as null: put back "absent".
    return { after, fields: pair.entry.changes.map((path, i) => ({ path, before: pair.entry.before![i] ?? undefined })) };
  }
  if (!pair.previous) return null;
  const before = normalizeContent(pair.previous.content);
  return { after, fields: changedPaths(before, after, 500).map((path) => ({ path, before: getAt(before, path) })) };
}

const laterChanged =
  "This can't be undone on its own, because the same part was changed again later. Use “Go back to this version” on an earlier save instead.";

/**
 * Undoes one save and nothing else: each field that save changed gets back the value it had just before it.
 * Later changes to other fields stay. Saved as a new version, so it can be undone too.
 */
export async function undoChange(id: string): Promise<ActionResult> {
  return guarded(async (): Promise<ActionResult> => {
    const user = await requireUserFor("any");
    const pair = await readHistoryPair(String(id));
    if (!pair) return fail("That version is no longer available.");
    const diff = fieldsOf(pair);
    if (!diff) return fail("This is the oldest version kept, so there's nothing earlier to go back to.");
    if (!diff.fields.length) return fail("That save didn't change anything you can undo.");

    // Only undo when everything this save changed is still exactly as it left it. If a later save edited the same
    // fields, or moved, added or removed items in the same list, writing the old values back by position could land
    // on the wrong item or wipe that later work.
    const current = await readContent();
    if (!diff.fields.every((f) => untouchedSince(current, diff.after, f.path))) return fail(laterChanged);
    const next = diff.fields.reduce((c, f) => setAt(c, f.path, f.before), current);
    if (!siteContentSchema.safeParse(next).success) return fail(laterChanged);
    await saveContent(next, { by: by(user), section: "undo", note: `Undid the change saved at ${when(pair.entry.savedAt)}`, previous: current });
    updateTag(CONTENT_TAG);
    return { ok: true, message: `Undone. Those fields are back to how they were before ${when(pair.entry.savedAt)}.` };
  });
}

/**
 * "Revert this field": puts back what one field held before a given save, leaving everything else as it is now.
 * Stops (instead of overwriting) when that field was changed again after that save. Saved as a new version.
 */
export async function revertField(historyId: string, path: Path, label?: string): Promise<ActionResult> {
  return guarded(async (): Promise<ActionResult> => {
    const user = await requireUserFor("any");
    if (!Array.isArray(path) || !path.length || path.length > 12 || !path.every((k) => typeof k === "string" || (typeof k === "number" && Number.isInteger(k) && k >= 0))) {
      return fail("That field can't be found.");
    }
    const pair = await readHistoryPair(String(historyId));
    if (!pair) return fail("That version is no longer available.");
    const diff = fieldsOf(pair);
    const field = diff?.fields.find((f) => sameValue(f.path, path));
    if (!diff || !field) return fail("That save didn't change this field, or its earlier value is no longer kept.");

    const current = await readContent();
    if (!untouchedSince(current, diff.after, field.path)) {
      return fail("This field was changed again after that save, so it can't be put back on its own. Change it on its screen instead.");
    }
    const key = field.path[0] as SectionKey;
    if (!(key in sectionSchemas)) return fail("That field can't be found.");
    const merged = setAt(current, field.path, field.before);
    const { content: clean, errors } = validateSections(merged, [key]);
    if (Object.keys(errors).length) return fail("The earlier value doesn't fit any more (another part of the page changed since). Change it on its screen instead.");
    const next = keepPreviousBanner(current, clean);
    const what = String(label ?? "").slice(0, 200) || "a field";
    await saveContent(next, { by: by(user), section: "revert", note: `Put back ${what} from before the save at ${when(pair.entry.savedAt)}`, previous: current });
    updateTag(CONTENT_TAG);
    return { ok: true, message: `Put back. ${what} is as it was before ${when(pair.entry.savedAt)}.` };
  });
}

// ---- Messages from the contact form ----

export async function setMessageRead(id: string, read: boolean): Promise<ActionResult> {
  return guarded(async (): Promise<ActionResult> => {
    await requireUserFor("any");
    const ok = await updateMessage(String(id), { read: read === true });
    return ok ? { ok: true } : fail("That message can't be found any more.");
  });
}

// ---- People ----

const validRole = (r: unknown): r is Role => r === "owner" || r === "editor";

export async function addUser(input: { name: string; email: string; role: string; password: string }): Promise<ActionResult> {
  return guarded(async (): Promise<ActionResult> => {
    await requireUserFor("owner");
    const name = String(input?.name ?? "").replace(/[\u0000-\u001F\u007F<>]/g, "").trim().slice(0, 80);
    const email = normalizeEmail(input?.email);
    const errors: Record<string, string> = {};
    if (!name) errors.name = "Add their name.";
    if (!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email)) errors.email = "Enter a full email address.";
    if (!validRole(input?.role)) errors.role = "Choose what they can do.";
    if (String(input?.password ?? "").length < MIN_PASSWORD) errors.password = `Use at least ${MIN_PASSWORD} characters.`;
    if (Object.keys(errors).length) return fail("Some fields need attention.", errors);

    const users = (await loadUsers()) ?? [];
    if (users.some((u) => u.email === email)) return fail("Some fields need attention.", { email: "Someone with this email already has access." });
    const user: StoredUser = {
      email,
      name,
      role: input.role as Role,
      passwordHash: await hashPassword(String(input.password).slice(0, 200)),
      sv: 1,
      createdAt: new Date().toISOString(),
    };
    await saveUsers([...users, user]);
    return { ok: true, message: `${name} can now sign in. Give them their temporary password and ask them to change it.` };
  });
}

export async function resetUserPassword(email: string, password: string): Promise<ActionResult> {
  return guarded(async (): Promise<ActionResult> => {
    await requireUserFor("owner");
    if (String(password ?? "").length < MIN_PASSWORD) return fail(`Use at least ${MIN_PASSWORD} characters.`);
    const users = (await loadUsers()) ?? [];
    const target = users.find((u) => u.email === normalizeEmail(email));
    if (!target) return fail("That person no longer has access.");
    target.passwordHash = await hashPassword(String(password).slice(0, 200));
    target.sv += 1; // signs them out everywhere
    await saveUsers(users);
    await clearFailures(target.email);
    return { ok: true, message: `New temporary password set for ${target.name}.` };
  });
}

export async function removeUser(email: string): Promise<ActionResult> {
  return guarded(async (): Promise<ActionResult> => {
    const me = await requireUserFor("owner");
    const users = (await loadUsers()) ?? [];
    const target = users.find((u) => u.email === normalizeEmail(email));
    if (!target) return { ok: true };
    if (target.email === me.email) return fail("You can't remove yourself. Ask another owner to do it.");
    if (target.role === "owner" && users.filter((u) => u.role === "owner").length === 1) {
      return fail("There must always be at least one owner.");
    }
    await saveUsers(users.filter((u) => u.email !== target.email));
    return { ok: true, message: `${target.name} no longer has access.` };
  });
}

export async function changeOwnPassword(current: string, next: string): Promise<ActionResult> {
  return guarded(async (): Promise<ActionResult> => {
    const me = await requireUserFor("any");
    if (String(next ?? "").length < MIN_PASSWORD) return fail("Some fields need attention.", { next: `Use at least ${MIN_PASSWORD} characters.` });
    const users = (await loadUsers()) ?? [];
    const stored = users.find((u) => u.email === me.email);
    if (!stored || !(await bcrypt.compare(String(current ?? ""), stored.passwordHash))) {
      return fail("Some fields need attention.", { current: "That isn't your current password." });
    }
    stored.passwordHash = await hashPassword(String(next).slice(0, 200));
    stored.sv += 1; // signs out other devices
    await saveUsers(users);
    await startSession(stored); // keeps this device signed in
    return { ok: true, message: "Your password is changed." };
  });
}
