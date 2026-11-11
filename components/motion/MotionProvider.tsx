"use client";

// Motion for React (the library formerly called Framer Motion), loaded lazily with only the DOM animation
// features (no layout/drag code), and those features arrive in their own chunk after the page starts. `strict` makes any accidental full `motion.*` import an
// error: use `m.*` components. reducedMotion="user": with prefers-reduced-motion, transforms are skipped.
import { LazyMotion, MotionConfig } from "motion/react";

// Loaded asynchronously: animations start a moment after hydration instead of adding to the first load.
const loadFeatures = () => import("./features").then((mod) => mod.default);

export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={loadFeatures} strict>
      <MotionConfig reducedMotion="user" transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
        {children}
      </MotionConfig>
    </LazyMotion>
  );
}
