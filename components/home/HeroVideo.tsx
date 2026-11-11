"use client";

// The original header video (hero "video" mode): muted, looping, no controls, purely decorative. It starts from
// JavaScript only when the visitor allows motion; with prefers-reduced-motion (or without JS) the poster shows.
import { useEffect, useRef } from "react";

type Props = { src: string; poster: string; /** CSS object-position from the poster photo. */ focus: string };

export function HeroVideo({ src, poster, focus }: Props) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      if (reduce.matches) {
        video.pause();
      } else {
        video.muted = true; // Browsers only autoplay muted video.
        video.play().catch(() => {
          /* Autoplay refused (e.g. data saver): the poster stays. */
        });
      }
    };
    sync();
    reduce.addEventListener("change", sync);
    return () => reduce.removeEventListener("change", sync);
  }, []);

  return (
    <video
      ref={ref}
      className="h-video-media"
      src={src}
      poster={poster}
      muted
      loop
      playsInline
      preload="none"
      disablePictureInPicture
      tabIndex={-1}
      style={{ objectPosition: focus }}
    />
  );
}
