"use client";

// Image reveal: a solid curtain slides away (scaleX to 0) while the photo settles from a slight zoom, when the
// box scrolls into view. Transform only. The box itself is sized by CSS (className) and clips its content.
import { m } from "motion/react";

const EASE = [0.76, 0, 0.24, 1] as const;
type Props = { className?: string; color?: "sand" | "blue" | "ink" | "bone"; children: React.ReactNode; delay?: number };
const colors = { sand: "var(--sand-2)", blue: "var(--blue)", ink: "var(--ink)", bone: "var(--bone)" };

export function Curtain({ className, color = "sand", children, delay = 0 }: Props) {
  return (
    <m.div
      className={className ? `curtain ${className}` : "curtain"}
      style={{ position: "relative", overflow: "hidden" }}
      initial="hidden"
      whileInView="shown"
      viewport={{ once: true, amount: 0.3 }}
    >
      <m.div
        className="curtain-media"
        style={{ position: "absolute", inset: 0 }}
        variants={{ hidden: { scale: 1.12 }, shown: { scale: 1, transition: { duration: 1.4, ease: [0.22, 1, 0.36, 1], delay } } }}
      >
        {children}
      </m.div>
      <m.span
        aria-hidden="true"
        className="curtain-cover"
        style={{ position: "absolute", inset: 0, background: colors[color], transformOrigin: "100% 50%", zIndex: 1 }}
        variants={{ hidden: { scaleX: 1 }, shown: { scaleX: 0, transition: { duration: 0.95, ease: EASE, delay } } }}
      />
    </m.div>
  );
}
