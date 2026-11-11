"use client";

// Gentle parallax for a photo: the box clips, the photo inside is a little taller and moves slower than the
// page while the box crosses the screen. Transform only (Motion uses the browser's scroll timeline where it
// can, so it runs off the main thread). Off when the visitor prefers reduced motion.
import { m, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";

type Props = { className?: string; /** Travel as a share of the box height (0.08 = ±8%). */ strength?: number; children: React.ReactNode };

export function Parallax({ className, strength = 0.08, children }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [`${-strength * 100}%`, `${strength * 100}%`]);
  return (
    <div ref={ref} className={className ? `parallax ${className}` : "parallax"} style={{ position: "relative", overflow: "hidden" }}>
      <m.div
        className="parallax-inner"
        style={{
          position: "absolute",
          inset: `${-strength * 100}% 0`,
          y: reduce ? 0 : y,
        }}
      >
        {children}
      </m.div>
    </div>
  );
}
