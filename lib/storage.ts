// All persistent state goes through this module: website content, version history, admin users, login
// attempts and uploaded photos. On Vercel it uses a private Vercel Blob store; in local development without
// Blob credentials it reads and writes the same paths under the git-ignored .data/ folder. Nothing else in
// the app knows which backend is in use.
import "server-only";
import { createReadStream, promises as fs } from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { BlobNotFoundError, del, get, list, put } from "@vercel/blob";
import type { UploadMode } from "./media";

export type StoredFile = { stream: ReadableStream<Uint8Array>; contentType: string; size: number | null };
export type ListedFile = { pathname: string; uploadedAt: Date };

export function storageMode(): "blob" | "local" {
  return process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID ? "blob" : "local";
}

/** See UploadMode in lib/media.ts. */
export function uploadMode(): UploadMode {
  if (storageMode() === "local") return "local";
  return process.env.BLOB_READ_WRITE_TOKEN ? "token" : "presigned";
}

const LOCAL_ROOT = path.join(process.cwd(), ".data");

function localPath(pathname: string): string {
  const full = path.resolve(LOCAL_ROOT, pathname);
  if (!full.startsWith(LOCAL_ROOT + path.sep)) throw new Error(`Refusing path outside .data: ${pathname}`);
  return full;
}

function assertWritable() {
  // Vercel functions have a read-only filesystem, so a missing Blob store must fail loudly, not silently.
  if (storageMode() === "local" && process.env.VERCEL) {
    throw new Error("No Blob store is connected to this project. Connect one in Vercel → Storage, then redeploy.");
  }
}

const CONTENT_TYPES: Record<string, string> = {
  ".json": "application/json",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};
const typeFor = (pathname: string) => CONTENT_TYPES[path.extname(pathname).toLowerCase()] ?? "application/octet-stream";

/** Reads a file, or null if it doesn't exist. `fresh` bypasses the Blob CDN cache (use it for data, not photos). */
export async function readFile(pathname: string, { fresh = true } = {}): Promise<StoredFile | null> {
  if (storageMode() === "blob") {
    try {
      const res = await get(pathname, { access: "private", useCache: !fresh });
      if (!res || res.statusCode !== 200) return null;
      return { stream: res.stream, contentType: res.blob.contentType, size: res.blob.size };
    } catch (err) {
      if (err instanceof BlobNotFoundError) return null;
      throw err;
    }
  }
  const file = localPath(pathname);
  try {
    const stat = await fs.stat(file);
    return {
      stream: Readable.toWeb(createReadStream(file)) as ReadableStream<Uint8Array>,
      contentType: typeFor(pathname),
      size: stat.size,
    };
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw err;
  }
}

export async function readJSON<T>(pathname: string): Promise<T | null> {
  const file = await readFile(pathname);
  if (!file) return null;
  const text = await new Response(file.stream).text();
  return JSON.parse(text) as T;
}

export async function writeFile(pathname: string, body: string | Buffer, contentType = typeFor(pathname)): Promise<void> {
  assertWritable();
  if (storageMode() === "blob") {
    await put(pathname, body, { access: "private", allowOverwrite: true, addRandomSuffix: false, contentType });
    return;
  }
  const file = localPath(pathname);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, body);
}

export async function writeJSON(pathname: string, data: unknown): Promise<void> {
  await writeFile(pathname, JSON.stringify(data, null, 2), "application/json");
}

export async function listFiles(prefix: string): Promise<ListedFile[]> {
  if (storageMode() === "blob") {
    const out: ListedFile[] = [];
    let cursor: string | undefined;
    do {
      const page = await list({ prefix, cursor, limit: 1000 });
      out.push(...page.blobs.map((b) => ({ pathname: b.pathname, uploadedAt: new Date(b.uploadedAt) })));
      cursor = page.hasMore ? page.cursor : undefined;
    } while (cursor);
    return out;
  }
  const dir = localPath(prefix.endsWith("/") ? prefix.slice(0, -1) : prefix);
  try {
    const names = await fs.readdir(dir);
    return Promise.all(
      names.map(async (name) => ({
        pathname: path.posix.join(prefix.endsWith("/") ? prefix.slice(0, -1) : prefix, name),
        uploadedAt: (await fs.stat(path.join(dir, name))).mtime,
      })),
    );
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw err;
  }
}

export async function deleteFiles(pathnames: string[]): Promise<void> {
  if (!pathnames.length) return;
  assertWritable();
  if (storageMode() === "blob") {
    await del(pathnames);
    return;
  }
  await Promise.all(pathnames.map((p) => fs.rm(localPath(p), { force: true })));
}
