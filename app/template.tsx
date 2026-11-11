"use client";

// Page transitions: each new page fades and rises in quickly (0.4s) when you move between pages. The very first
// page load is NOT animated, so the first paint and the banner are never delayed. The header and footer live
// in the layout, outside this template, so they stay put. Transform and opacity only.
import { m } from "motion/react";
import { useEffect, useState } from "react";

let navigated = false;

export default function Template({ children }: { children: React.ReactNode }) {
  const [animate] = useState(() => navigated);
  useEffect(() => {
    navigated = true;
  }, []);
  return (
    <m.div
      initial={animate ? { opacity: 0, y: 14 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </m.div>
  );
}
