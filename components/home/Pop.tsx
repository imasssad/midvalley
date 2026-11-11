"use client";

// "Pop" reveals for small things (value-strip items, glass chips, feature pills): when the group scrolls into
// view its <PopItem> children grow from 90% and fade in one after another, with a soft spring. An item can also
// drift in from a side (from = { x, y } in px). Transform and opacity only. Items carry .reveal-item, so the CSS
// fallbacks in app/globals.css show everything at once without JavaScript or with prefers-reduced-motion (and
// Motion's reducedMotion="user" skips the transforms).
import { m, type Variants } from "motion/react";

const tags = { div: m.div, ul: m.ul, li: m.li, span: m.span };
type Tag = keyof typeof tags;
type From = { x?: number; y?: number };

const parent: Variants = {
  hidden: {},
  shown: ({ gap, delay }: { gap: number; delay: number }) => ({ transition: { staggerChildren: gap, delayChildren: delay } }),
};
const child: Variants = {
  hidden: (from: From = {}) => ({ opacity: 0, scale: 0.9, x: from.x ?? 0, y: from.y ?? 14 }),
  shown: {
    opacity: 1,
    scale: 1,
    x: 0,
    y: 0,
    transition: { type: "spring", stiffness: 240, damping: 22, mass: 0.9, opacity: { duration: 0.45, ease: "easeOut" } },
  },
};

type GroupProps = {
  as?: Tag;
  className?: string;
  /** Seconds between items. */
  gap?: number;
  /** Seconds before the first item (after the group is in view). */
  delay?: number;
  children: React.ReactNode;
};

export function PopGroup({ as = "div", className, gap = 0.07, delay = 0.08, children }: GroupProps) {
  const C = tags[as] as typeof m.div;
  return (
    <C
      className={className}
      variants={parent}
      custom={{ gap, delay }}
      initial="hidden"
      whileInView="shown"
      viewport={{ once: true, amount: 0.2, margin: "0px 0px -6% 0px" }}
    >
      {children}
    </C>
  );
}

type ItemProps = { as?: Tag; className?: string; from?: From; children: React.ReactNode };

export function PopItem({ as = "div", className, from, children }: ItemProps) {
  const C = tags[as] as typeof m.div;
  return (
    <C className={className ? `reveal-item ${className}` : "reveal-item"} variants={child} custom={from}>
      {children}
    </C>
  );
}
