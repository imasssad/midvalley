"use client";

// Facility photo gallery: a 2x2 grid of square thumbnail buttons that open a lightbox (native <dialog>, no
// library). The dialog gives focus trapping and Escape for free; arrow keys and the buttons step through the
// photos, and closing returns focus to the thumbnail of the photo last shown.
// Motion: each thumbnail is uncovered by a sliding curtain when it scrolls into view (Curtain, staggered 0.1s);
// on hover the photo zooms to 1.05 and a thin orange inner rule fades in; a tap presses it to 0.98 (CSS,
// transform/opacity only). The lightbox fades in (CSS).
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/Icon";
import { Curtain } from "@/components/motion/Curtain";
import { Photo } from "@/components/Photo";
import type { Photo as PhotoData, SiteContent } from "@/lib/content-schema";

type Props = {
  photos: PhotoData[];
  /** The editable UI labels: galleryOpen ("Open photo", start of each thumbnail's accessible name), close,
   *  previousPhoto, nextPhoto and photoCount ("{current} of {total}"). */
  labels: Pick<SiteContent["labels"], "galleryOpen" | "close" | "previousPhoto" | "nextPhoto" | "photoCount">;
  /** The dialog's accessible name (the section heading). */
  dialogLabel: string;
};

export function Gallery({ photos, labels, dialogLabel }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const thumbRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [index, setIndex] = useState<number | null>(null);
  const count = photos.length;
  const current = index === null ? null : photos[index];

  // Open the dialog once its content has rendered, so focus lands on the close button (first in the dialog).
  useEffect(() => {
    const dialog = dialogRef.current;
    if (index !== null && dialog && !dialog.open) dialog.showModal();
  }, [index]);

  const close = () => dialogRef.current?.close();
  const step = (by: number) => setIndex((i) => (i === null ? i : (i + by + count) % count));

  // Runs for every way of closing (button, Escape, backdrop click).
  const onClose = () => {
    const last = index;
    setIndex(null);
    if (last !== null) thumbRefs.current[last]?.focus();
  };

  return (
    <>
      <ul className="h-gallery">
        {photos.map((p, i) => (
          <li key={`${i}-${p.src}`}>
            <button
              type="button"
              className="h-thumb"
              ref={(el) => {
                thumbRefs.current[i] = el;
              }}
              aria-haspopup="dialog"
              aria-label={p.alt ? `${labels.galleryOpen}: ${p.alt}` : `${labels.galleryOpen} ${i + 1}`}
              onClick={() => setIndex(i)}
            >
              <Curtain className="h-thumb-media" delay={i * 0.1}>
                <Photo photo={p} className="h-thumb-photo" sizes="(max-width: 680px) 46vw, (max-width: 1100px) 24vw, 330px" />
              </Curtain>
            </button>
          </li>
        ))}
      </ul>

      <dialog
        ref={dialogRef}
        className="h-lb on-dark"
        aria-label={dialogLabel}
        onClose={onClose}
        onClick={(e) => {
          // A click on the dark area around the photo closes it.
          if (e.target === e.currentTarget || (e.target as HTMLElement).dataset.dismiss !== undefined) close();
        }}
        onKeyDown={(e) => {
          if (count < 2) return;
          if (e.key === "ArrowLeft") step(-1);
          if (e.key === "ArrowRight") step(1);
        }}
      >
        {current && index !== null && (
          <figure className="h-lb-figure" data-dismiss>
            <button type="button" className="h-lb-btn h-lb-close" onClick={close}>
              <Icon name="close" size={22} />
              <span className="sr-only">{labels.close}</span>
            </button>
            <div className="h-lb-stage" data-dismiss>
              <Image
                key={current.src}
                src={current.src}
                alt={current.alt}
                fill
                sizes="90vw"
                quality={85}
                style={{ objectFit: "contain" }}
              />
            </div>
            <figcaption className="h-lb-caption" aria-live="polite">
              <span className="h-lb-count">
                {labels.photoCount.replace("{current}", String(index + 1)).replace("{total}", String(count))}
              </span>
              {current.alt && <span>{current.alt}</span>}
            </figcaption>
            {count > 1 && (
              <>
                <button type="button" className="h-lb-btn h-lb-prev" onClick={() => step(-1)}>
                  <Icon name="chevron" size={24} />
                  <span className="sr-only">{labels.previousPhoto}</span>
                </button>
                <button type="button" className="h-lb-btn h-lb-next" onClick={() => step(1)}>
                  <Icon name="chevron" size={24} />
                  <span className="sr-only">{labels.nextPhoto}</span>
                </button>
              </>
            )}
          </figure>
        )}
      </dialog>
    </>
  );
}
