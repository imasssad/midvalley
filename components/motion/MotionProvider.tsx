"use client";

// Motion for React (the library formerly called Framer Motion), loaded lazily with only the DOM animation
// features (no layout/drag code), so it stays small. `strict` makes any accidental full `motion.*` import an
// error: use `m.*` components. reducedMotion="user": with prefers-reduced-motion, transforms are skipped.
import { LazyMotion, MotionConfig, domAnimation } from "motion/react";

export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user" transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
        {children}
      </MotionConfig>
    </LazyMotion>
  );
}
