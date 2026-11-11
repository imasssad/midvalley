// Photo uploads from the admin panel (ported from rapidselfstorage). Large photos never pass through a function on
// Vercel: the browser asks this route for short-lived permission, then uploads straight to the private Blob store.
// - "token" mode (BLOB_READ_WRITE_TOKEN set): the browser gets a client token (handleUpload).
// - "presigned" mode (store connected with Vercel OIDC, BLOB_STORE_ID): the browser gets a presigned URL
//   (handleUploadPresigned + issueSignedToken), which needs no read-write token.
// - Local development (.data/ folder): the browser posts the file here and it's written to .data/media/.
// In token and presigned mode the browser then sends the file to https://vercel.com/api/blob (the Blob API).
// Auth is checked before any permission is handed out. After the upload the editor calls the optimizePhoto
// Server Action (app/admin/actions.ts), which writes the resized WebP the website shows.
import { issueSignedToken } from "@vercel/blob";
import { handleUpload, handleUploadPresigned, type HandleUploadBody, type HandleUploadPresignedBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { AuthError, requireUserFor } from "@/lib/auth";
import { isPhotoType, MAX_PHOTO_BYTES, MEDIA_PATH, mediaPathFor, PHOTO_TYPES, sniffPhotoType } from "@/lib/media";
import { storageMode, writeFile } from "@/lib/storage";

// Runs on the Node.js runtime (the default; the `runtime` segment option is not allowed with Cache Components).

const error = (message: string, status = 400) => NextResponse.json({ error: message }, { status });
const allowedContentTypes = Object.keys(PHOTO_TYPES);

/** CSRF protection for this mutating route handler: the request must come from this site. */
function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  return !!origin && origin === new URL(request.url).origin;
}

async function checkUpload(pathname: string) {
  await requireUserFor("any");
  // Originals only: the optimised .webp copies are written by the server, never uploaded by the browser.
  if (!MEDIA_PATH.test(pathname)) throw new AuthError("That file name isn't allowed.");
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return error("This request didn't come from the admin panel.", 403);

  try {
    if (storageMode() === "local") {
      await requireUserFor("any");
      const form = await request.formData();
      const file = form.get("file");
      if (!(file instanceof File)) return error("Choose a photo to upload.");
      if (file.size > MAX_PHOTO_BYTES) return error("That photo is over 8 MB. Use a smaller one.");
      const bytes = new Uint8Array(await file.arrayBuffer());
      const type = sniffPhotoType(bytes);
      if (!type || !isPhotoType(file.type)) return error("Use a JPG, PNG or WebP photo.");
      const pathname = mediaPathFor(file.name, type);
      await writeFile(pathname, Buffer.from(bytes), type);
      return NextResponse.json({ pathname });
    }

    const body = (await request.json()) as HandleUploadBody | HandleUploadPresignedBody;

    if (body.type === "blob.generate-presigned-url") {
      const result = await handleUploadPresigned({
        body,
        request,
        getSignedToken: async (pathname) => {
          await checkUpload(pathname);
          const validUntil = Date.now() + 10 * 60 * 1000;
          const token = await issueSignedToken({ pathname, operations: ["put"], allowedContentTypes, maximumSizeInBytes: MAX_PHOTO_BYTES, validUntil });
          return { token, urlOptions: { validUntil, allowedContentTypes, maximumSizeInBytes: MAX_PHOTO_BYTES, addRandomSuffix: false, allowOverwrite: false } };
        },
      });
      return NextResponse.json(result);
    }

    if (body.type === "blob.generate-client-token") {
      const result = await handleUpload({
        body,
        request,
        onBeforeGenerateToken: async (pathname) => {
          await checkUpload(pathname);
          return { allowedContentTypes, maximumSizeInBytes: MAX_PHOTO_BYTES, addRandomSuffix: false, allowOverwrite: false };
        },
      });
      return NextResponse.json(result);
    }

    return error("Unknown upload request.");
  } catch (err) {
    if (err instanceof AuthError) return error(err.message, 401);
    console.error("Upload failed", err);
    return error("The upload didn't work. Try again.", 500);
  }
}
