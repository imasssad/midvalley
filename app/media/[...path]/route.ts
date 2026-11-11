// Serves photos uploaded in the admin panel from the private Blob store (or .data/ locally). Only
// media/<id>-<name>.<jpg|png|webp> paths are served, so nothing else in the store (content, users, messages) can
// ever be read through here. Every upload has a unique name, so responses are cached forever.
import { MEDIA_PATH } from "@/lib/media";
import { readFile } from "@/lib/storage";

// Runs on the Node.js runtime (the default; the `runtime` segment option is not allowed with Cache Components).

const TYPES = { jpg: "image/jpeg", png: "image/png", webp: "image/webp" } as const;

export async function GET(_request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const pathname = `media/${path.join("/")}`;
  if (!MEDIA_PATH.test(pathname)) return new Response("Not found", { status: 404 });

  const file = await readFile(pathname, { fresh: false });
  if (!file) return new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });

  const headers = new Headers({
    "Content-Type": TYPES[pathname.split(".").pop() as keyof typeof TYPES],
    "Cache-Control": "public, max-age=31536000, immutable",
    "X-Content-Type-Options": "nosniff",
    "Content-Security-Policy": "default-src 'none'; sandbox",
  });
  if (file.size !== null) headers.set("Content-Length", String(file.size));
  return new Response(file.stream, { headers });
}
