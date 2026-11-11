"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

declare global {
  interface Window {
    __mvsMotion?: boolean;
  }
}

// Fade-up on scroll for server-rendered content marked [data-reveal]. The inline script in the layout adds
// `.js` to <html> before paint; CSS hides [data-reveal] only under it and only when motion is allowed.
export function Motion() {
  // Runs again after each client-side page change, for the new page's sections.
  const pathname = usePathname();
  useEffect(() => {
    window.__mvsMotion = true;
    const els = document.querySelectorAll("[data-reveal]:not(.is-in)");
    if (!("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("is-in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -6% 0px", threshold: 0.08 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [pathname]);
  return null;
}
