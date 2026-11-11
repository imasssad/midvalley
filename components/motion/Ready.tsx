"use client";

// Tells the layout's boot script that the app has started (see bootScript in app/layout.tsx).
import { useEffect } from "react";

declare global {
  interface Window {
    __mvsMotion?: boolean;
  }
}

export function Ready() {
  useEffect(() => {
    window.__mvsMotion = true;
    document.documentElement.classList.add("js");
  }, []);
  return null;
}
