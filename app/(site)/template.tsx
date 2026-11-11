"use client";

// Page transitions: each new page fades up quickly (0.35s) when you move between pages. It starts at 40% opacity,
// not 0, so there is never an empty frame. The very first page load is NOT animated, so the first paint and the
// banner are never delayed, and with prefers-reduced-motion nothing animates. The header and footer live in the
// layout, outside this template, so they stay put. Transform and opacity only.
import { m, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

let navigated = false;

export default function Template({ children }: { children: React.ReactNode }) {
  const [animate] = useState(() => navigated);
  const reduce = useReducedMotion();
  useEffect(() => {
    navigated = true;
  }, []);
  return (
    <m.div
      initial={animate && !reduce ? { opacity: 0.4, y: 10 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </m.div>
  );
}
