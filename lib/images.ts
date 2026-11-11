// Optimise-on-upload for photos added in the admin panel. The browser uploads the original file (straight to the
// private Blob store, or to .data/ locally, see app/api/admin/upload); this then reads it back from storage and
// writes a resized WebP next to it (at most 2560px wide, quality 82, rotated upright, metadata stripped). The
// website shows the WebP; the original stays in storage (photo.original) so nothing is lost. Server only (sharp).
import "server-only";
import sharp, { type OutputInfo } from "sharp";
import { MAX_PHOTO_BYTES, MEDIA_PATH, mediaPathFor, OPTIMIZED_MAX_WIDTH, OPTIMIZED_QUALITY, sniffPhotoType, type OptimizedPhoto } from "./media";
import { readFile, writeFile } from "./storage";

/** Raised with a message that is safe to show in the admin panel. */
export class ImageError extends Error {}

async function readBytes(pathname: string): Promise<Buffer> {
  const file = await readFile(pathname);
  if (!file) throw new ImageError("The uploaded photo couldn't be found. Upload it again.");
  if (file.size !== null && file.size > MAX_PHOTO_BYTES) throw new ImageError("That photo is over 8 MB. Use a smaller one.");
  const bytes = Buffer.from(await new Response(file.stream).arrayBuffer());
  if (bytes.length > MAX_PHOTO_BYTES) throw new ImageError("That photo is over 8 MB. Use a smaller one.");
  return bytes;
}

/**
 * Makes the website copy of an uploaded photo. `original` is the stored path ("media/<id>-<name>.jpg" or the
 * "/media/…" src form). Returns the WebP's src, the original's src and the WebP's pixel size.
 */
export async function optimizeUpload(original: string): Promise<OptimizedPhoto> {
  const pathname = original.replace(/^\//, "");
  if (!MEDIA_PATH.test(pathname)) throw new ImageError("That file name isn't allowed.");
  const bytes = await readBytes(pathname);
  if (!sniffPhotoType(bytes)) throw new ImageError("Use a JPG, PNG or WebP photo.");

  let out: { data: Buffer; info: OutputInfo };
  try {
    out = await sharp(bytes, { limitInputPixels: 100_000_000 })
      .rotate() // upright, from the camera's orientation tag
      .resize({ width: OPTIMIZED_MAX_WIDTH, withoutEnlargement: true })
      .webp({ quality: OPTIMIZED_QUALITY, effort: 4 })
      .toBuffer({ resolveWithObject: true });
  } catch (err) {
    console.error("Photo optimisation failed", err);
    throw new ImageError("This photo couldn't be read. Try saving it again as a JPG or PNG, then upload it.");
  }

  // "media/<id>-<name>.jpg" → "<name>", so the WebP keeps a readable name with a new unique id.
  const name = pathname.replace(/^media\/[a-z0-9]{16}-/, "").replace(/\.[a-z]+$/, "");
  const webp = mediaPathFor(name, "image/webp");
  await writeFile(webp, out.data, "image/webp");
  return { src: `/${webp}`, original: `/${pathname}`, width: out.info.width, height: out.info.height };
}
