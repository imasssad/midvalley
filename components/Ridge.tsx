// The "valley" motif: a soft double mountain ridge (like the mountains in the Mid Valley banner logo), used as a
// divider at the top or bottom edge of a section, and faintly inside the header. Decorative only (aria-hidden).
// `fill` is the colour of the section it blends into; the back ridge is drawn semi-transparent.
type Props = {
  /** Where it sits in its (position: relative) parent. */
  edge?: "top" | "bottom";
  fill?: string;
  className?: string;
  /** Height in px of the ridge band. */
  height?: number;
};

export function Ridge({ edge = "bottom", fill = "var(--white)", className, height = 72 }: Props) {
  return (
    <svg
      className={className ? `ridge ridge-${edge} ${className}` : `ridge ridge-${edge}`}
      viewBox="0 0 1440 120"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
      style={{ height }}
    >
      <path
        d="M0 120V78l120-34 95 26 150-58 120 44 110-30 140 52 125-40 160 46 120-28 110 30 105-22 85 18v36Z"
        fill={fill}
        opacity="0.45"
      />
      <path d="M0 120V96l140-30 120 22 170-46 150 40 130-26 160 38 140-30 150 30 120-18 160 26v38Z" fill={fill} />
    </svg>
  );
}
