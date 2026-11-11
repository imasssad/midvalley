"use client";

// One photo in the admin panel: a preview, "Choose a new photo", the description and (for content photos) which part
// stays in view when it is cropped. Uploading: the browser checks the file (JPG/PNG/WebP, up to 8 MB), sends the
// original to storage (straight to the private Blob store, or to the server locally), then asks the server to make
// the website copy (optimizePhoto: a WebP at most 2560px wide). The photo then points at the WebP and keeps the
// original's address and the WebP's pixel size. Nothing is live until the screen is saved.
import { useEffect, useRef, useState } from "react";
import { optimizePhoto } from "@/app/admin/actions";
import type { Photo } from "@/lib/content-schema";
import { isPhotoType, MAX_PHOTO_BYTES, MIN_BANNER_WIDTH, mediaPathFor, type UploadMode } from "@/lib/media";
import type { PhotoVariant } from "./screen-fields";

type Props = {
  id: string;
  label: string;
  help?: string;
  /** Undefined or src "" when no photo is set (optional photos only). */
  value: Photo | undefined;
  onChange: (v: Photo | undefined) => void;
  errors: { src?: string; alt?: string };
  uploadMode: UploadMode;
  /** The photo as last saved; when it differs, this one is new and not saved yet. */
  savedSrc?: string;
  variant?: PhotoVariant;
  /** May be removed altogether (undefined). */
  optional?: boolean;
};

const EMPTY: Photo = { src: "", alt: "", focus: "50% 50%" };

const FOCUS_OPTIONS = [
  { value: "50% 50%", label: "The middle" },
  { value: "50% 20%", label: "The top" },
  { value: "50% 80%", label: "The bottom" },
  { value: "20% 50%", label: "The left side" },
  { value: "80% 50%", label: "The right side" },
];

async function uploadOriginal(file: File, mode: UploadMode): Promise<string> {
  if (!isPhotoType(file.type)) throw new Error("Use a JPG, PNG or WebP photo.");
  if (file.size > MAX_PHOTO_BYTES) throw new Error("That photo is over 8 MB. Use a smaller one, or export it at a lower size.");

  if (mode !== "local") {
    // Straight from the browser to the private Blob store (https://vercel.com/api/blob); the server only hands out
    // short-lived permission (a client token, or a presigned URL when the store is connected with Vercel OIDC).
    const { upload, uploadPresigned } = await import("@vercel/blob/client");
    const send = mode === "token" ? upload : uploadPresigned;
    const blob = await send(mediaPathFor(file.name, file.type), file, {
      access: "private",
      handleUploadUrl: "/api/admin/upload",
      contentType: file.type,
    });
    return `/${blob.pathname}`;
  }

  const body = new FormData();
  body.append("file", file);
  const res = await fetch("/api/admin/upload", { method: "POST", body });
  const json = (await res.json().catch(() => ({}))) as { pathname?: string; error?: string };
  if (!res.ok || !json.pathname) throw new Error(json.error ?? "The upload didn't work. Try again.");
  return `/${json.pathname}`;
}

export function PhotoField({ id, label, help, value, onChange, errors, uploadMode, savedSrc, variant = "photo", optional = false }: Props) {
  const photo = value ?? EMPTY;
  const input = useRef<HTMLInputElement>(null);
  // The just-uploaded file, shown from this computer so it appears instantly.
  const [local, setLocal] = useState<{ src: string; url: string } | null>(null);
  const [busy, setBusy] = useState<null | "upload" | "optimize">(null);
  const [problem, setProblem] = useState<string | null>(null);
  const isBanner = variant === "banner" || variant === "bannerOptional";
  const isLogo = variant === "logo";

  useEffect(() => () => void (local && URL.revokeObjectURL(local.url)), [local]);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setProblem(null);
    try {
      if (!isPhotoType(file.type)) throw new Error("Use a JPG, PNG or WebP photo.");
      if (file.size > MAX_PHOTO_BYTES) throw new Error("That photo is over 8 MB. Use a smaller one, or export it at a lower size.");
      setBusy("upload");
      const original = await uploadOriginal(file, uploadMode);
      setBusy("optimize");
      const res = await optimizePhoto(original);
      if (!res.ok) throw new Error(res.error);
      setLocal({ src: res.photo.src, url: URL.createObjectURL(file) });
      onChange({
        ...photo,
        src: res.photo.src,
        original: res.photo.original,
        width: res.photo.width,
        height: res.photo.height,
        // A new photo starts centred; the old photo's crop rarely suits it.
        focus: "50% 50%",
      });
    } catch (err) {
      setProblem(err instanceof Error ? err.message : "The upload didn't work. Try again.");
    } finally {
      setBusy(null);
      if (input.current) input.current.value = "";
    }
  }

  const has = Boolean(photo.src);
  const shown = local?.src === photo.src ? local.url : photo.src;
  const unsaved = savedSrc !== undefined && savedSrc !== photo.src && has;
  const narrow = isBanner && has && photo.width !== undefined && photo.width < MIN_BANNER_WIDTH;
  const describedBy = [help && `${id}-help`, (problem || errors.src) && `${id}-error`].filter(Boolean).join(" ") || undefined;

  return (
    <fieldset className="group photo-field" id={id}>
      <legend>{label}</legend>
      {help && (
        <p className="help" id={`${id}-help`}>
          {help}
        </p>
      )}
      <div className="photo-row">
        <div className={`photo-preview${isBanner || isLogo ? " is-contain" : ""}${has ? "" : " is-empty"}`}>
          {has ? (
            // eslint-disable-next-line @next/next/no-img-element -- admin preview of an uploaded or shipped file
            <img src={shown} alt="" style={isBanner || isLogo ? undefined : { objectPosition: photo.focus }} />
          ) : variant === "bannerOptional" ? (
            <span>Empty: this screen size shows the computer banner.</span>
          ) : (
            <span>No photo yet.</span>
          )}
          {unsaved && <span className="photo-badge">New, not saved yet</span>}
        </div>
        <div className="photo-controls">
          <input
            ref={input}
            id={`${id}-file`}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only-admin"
            aria-describedby={describedBy}
            disabled={busy !== null}
            onChange={(e) => void onFile(e.target.files?.[0])}
          />
          <label htmlFor={`${id}-file`} className={busy ? "btn-admin secondary is-busy" : "btn-admin secondary"} aria-disabled={busy !== null}>
            {busy === "upload" ? "Uploading…" : busy === "optimize" ? "Preparing for the web…" : has ? "Choose a new photo" : "Choose a photo"}
            <span className="sr-only-admin"> for {label}</span>
          </label>
          <p className="sr-only-admin" role="status" aria-live="polite">
            {busy === "upload" ? "Uploading the photo." : busy === "optimize" ? "Preparing the photo for the web." : ""}
          </p>
          {has && photo.width && photo.height ? (
            <p className="photo-size">
              Web copy: {photo.width} × {photo.height} pixels{photo.original ? " (your original file is kept)" : ""}.
            </p>
          ) : null}
          {narrow && (
            <p className="field-warn" role="status">
              This banner is only {photo.width} pixels wide, so it may look soft on large screens. One at least {MIN_BANNER_WIDTH} pixels wide looks sharper. You can still save it.
            </p>
          )}
          {(problem || errors.src) && (
            <p className="field-error" id={`${id}-error`} role="alert">
              {problem ?? errors.src}
            </p>
          )}
          {variant === "bannerOptional" && has && (
            <button type="button" className="link-btn" onClick={() => onChange({ ...EMPTY })}>
              Leave empty (use the computer banner)
            </button>
          )}
          {optional && has && (
            <button type="button" className="link-btn" onClick={() => onChange(undefined)}>
              Remove this photo
            </button>
          )}
          {!isBanner && has && (
            <div className="field">
              <label htmlFor={`${id}-alt`}>{isLogo ? "Text read out instead of the logo" : "Describe the photo"}</label>
              <p className="help" id={`${id}-alt-help`}>
                {isLogo
                  ? "Usually your business name."
                  : "For people who can't see it, and for Google. For example: Wide drive-up aisle between storage buildings at dusk."}
              </p>
              <input
                id={`${id}-alt`}
                type="text"
                maxLength={250}
                value={photo.alt}
                onChange={(e) => onChange({ ...photo, alt: e.target.value })}
                aria-invalid={errors.alt ? true : undefined}
                aria-describedby={[`${id}-alt-help`, errors.alt && `${id}-alt-error`].filter(Boolean).join(" ")}
              />
              {errors.alt && (
                <p className="field-error" id={`${id}-alt-error`} role="alert">
                  {errors.alt}
                </p>
              )}
            </div>
          )}
          {variant === "photo" && has && (
            <div className="field">
              <label htmlFor={`${id}-focus`}>When the photo is cropped, keep in view</label>
              <select id={`${id}-focus`} value={photo.focus} onChange={(e) => onChange({ ...photo, focus: e.target.value })}>
                {!FOCUS_OPTIONS.some((o) => o.value === photo.focus) && <option value={photo.focus}>As set up now</option>}
                {FOCUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>
    </fieldset>
  );
}
