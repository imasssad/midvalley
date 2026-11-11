// A content photo that fills its box (the box sets the size and aspect ratio in CSS) and is cropped with
// object-fit: cover around the photo's focal point from the content data. Never stretched.
import Image from "next/image";
import type { Photo as PhotoData } from "@/lib/content-schema";

type Props = {
  photo: PhotoData;
  /** The `sizes` attribute: how wide the box is at each screen size, so the browser picks the right file. */
  sizes: string;
  className?: string;
  /** Above the fold only. */
  eager?: boolean;
  quality?: 60 | 75 | 85;
};

export function Photo({ photo, sizes, className, eager, quality = 75 }: Props) {
  return (
    <div className={className ? `photo ${className}` : "photo"}>
      <Image
        src={photo.src}
        alt={photo.alt}
        fill
        sizes={sizes}
        quality={quality}
        loading={eager ? "eager" : "lazy"}
        fetchPriority={eager ? "high" : undefined}
        style={{ objectFit: "cover", objectPosition: photo.focus }}
      />
    </div>
  );
}
