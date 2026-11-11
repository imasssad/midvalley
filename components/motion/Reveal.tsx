"use client";

// Scroll reveals. <Reveal> fades and rises one block into place when it scrolls into view; <Stagger> does the
// same for its <StaggerItem> children one after another. Transform and opacity only. If JavaScript never starts
// or the visitor prefers reduced motion, CSS in app/globals.css shows everything (.reveal / .reveal-item).
import { m, type Variants } from "motion/react";

const tags = { div: m.div, section: m.section, ul: m.ul, ol: m.ol, li: m.li, article: m.article, figure: m.figure, p: m.p, header: m.header, dl: m.dl };
type Tag = keyof typeof tags;
const EASE = [0.22, 1, 0.36, 1] as const;

type RevealProps = {
  as?: Tag;
  className?: string;
  /** Seconds before it starts (after it is in view). */
  delay?: number;
  /** How far it rises, in px. */
  y?: number;
  /** Rise from the side instead: "left" | "right". */
  from?: "up" | "left" | "right";
  children: React.ReactNode;
  id?: string;
  style?: React.CSSProperties;
};

export function Reveal({ as = "div", className, delay = 0, y = 32, from = "up", children, id, style }: RevealProps) {
  const C = tags[as] as typeof m.div;
  const hidden = from === "up" ? { opacity: 0, y } : { opacity: 0, x: from === "left" ? -y : y };
  return (
    <C
      id={id}
      style={style}
      className={className ? `reveal ${className}` : "reveal"}
      initial={hidden}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, amount: 0.15, margin: "0px 0px -8% 0px" }}
      transition={{ duration: 0.8, ease: EASE, delay }}
    >
      {children}
    </C>
  );
}

const parent: Variants = {
  hidden: {},
  shown: (gap: number) => ({ transition: { staggerChildren: gap, delayChildren: 0.05 } }),
};
const child: Variants = {
  hidden: { opacity: 0, y: 28 },
  shown: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
};

type StaggerProps = { as?: Tag; className?: string; gap?: number; children: React.ReactNode; id?: string; "aria-label"?: string; "aria-labelledby"?: string };

export function Stagger({ as = "div", className, gap = 0.09, children, ...rest }: StaggerProps) {
  const C = tags[as] as typeof m.div;
  return (
    <C
      {...rest}
      className={className}
      variants={parent}
      custom={gap}
      initial="hidden"
      whileInView="shown"
      viewport={{ once: true, amount: 0.12, margin: "0px 0px -6% 0px" }}
    >
      {children}
    </C>
  );
}

export function StaggerItem({ as = "div", className, children, id, style }: { as?: Tag; className?: string; children: React.ReactNode; id?: string; style?: React.CSSProperties }) {
  const C = tags[as] as typeof m.div;
  return (
    <C id={id} style={style} className={className ? `reveal-item ${className}` : "reveal-item"} variants={child}>
      {children}
    </C>
  );
}
