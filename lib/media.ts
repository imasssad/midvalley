// Rules for uploaded photos, shared by the browser (before uploading) and the server (before accepting).
export const MAX_PHOTO_BYTES = 8 * 1024 * 1024;

/**
 * How the admin panel uploads photos (decided on the server by lib/storage.ts uploadMode()):
 * - "token": client upload with a short-lived client token (needs BLOB_READ_WRITE_TOKEN)
 * - "presigned": client upload with a presigned URL (works with Vercel OIDC + BLOB_STORE_ID, no token needed)
 * - "local": the browser posts the file to the server, which writes it to .data/
 */
export type UploadMode = "token" | "presigned" | "local";
export const PHOTO_TYPES = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" } as const;
export type PhotoType = keyof typeof PHOTO_TYPES;

/** media/<random-id>-<sanitized-name>.<ext> — unique per upload, so photos can be cached forever. */
export const MEDIA_PATH = /^media\/[a-z0-9]{16}-[a-z0-9-]{1,60}\.(jpg|png|webp)$/;

export function isPhotoType(type: string): type is PhotoType {
  return type in PHOTO_TYPES;
}

export function mediaPathFor(fileName: string, type: PhotoType): string {
  const id = Array.from(crypto.getRandomValues(new Uint8Array(8)), (b) => b.toString(16).padStart(2, "0")).join("");
  const base =
    fileName
      .replace(/\.[^.]*$/, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "photo";
  return `media/${id}-${base}.${PHOTO_TYPES[type]}`;
}

/** Checks the file's first bytes really are a JPEG, PNG or WebP image. */
export function sniffPhotoType(bytes: Uint8Array): PhotoType | null {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "image/png";
  const ascii = (a: number, b: number) => String.fromCharCode(...bytes.slice(a, b));
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "image/webp";
  return null;
}
