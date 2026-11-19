// "Rent a unit in three easy steps", right after Storage Sizes, on mist. The section pill and the heading (navy-to-
// blue gradient text), then the steps as glossy rounded cards in a row (stacked from 900px down), joined by a soft
// glowing gradient line (static) with a small glossy arrow chip in each gap (a line down the left when stacked).
// Each card: a big condensed step number in gradient text with a small glossy icon chip beside it (decorative: door, card, key),
// the title in condensed caps and the text. Under the cards, the Rent Online and Call buttons for each location
// (LocationActions, as on Storage Sizes). Every word comes from content.home.steps; the numbers are generated.
// Renders nothing while switched off or without steps.
// Motion: heading rises in (Reveal), the cards come in one after another (Stagger), the
// buttons rise in last. Cards lift onto a blue glow on hover (.card.lift, CSS).
import { Icon, type IconKey } from "@/components/Icon";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/Reveal";
import type { SiteContent } from "@/lib/content-schema";
import { LocationActions } from "./LocationActions";
import { visibleSteps } from "./sectionNumbers";

const ICONS: IconKey[] = ["door", "card", "key", "check"];

export function RentSteps({ content, no }: { content: SiteContent; no: string }) {
  const items = visibleSteps(content);
  if (items.length === 0) return null;
  const { steps } = content.home;
  return (
    <section id="how-to-rent" className="section bg-sand h-steps" aria-labelledby="home-steps-heading">
      <span className="glow-blob h-steps-blob" aria-hidden="true" />
      <div className="wrap h-layer">
        <Reveal className="sec-head">
          <span className="sec-no" aria-hidden="true">
            {no}
          </span>
          <h2 id="home-steps-heading" className="grad-text">
            {steps.heading}
          </h2>
        </Reveal>
        <div className="h-steps-stage" style={{ "--h-steps": items.length } as React.CSSProperties}>
          <span className="h-steps-line" aria-hidden="true" />
          <Stagger as="ol" className="h-steps-list" gap={0.14}>
            {items.map((s, i) => (
              <StaggerItem as="li" className="h-step-item" key={`${i}-${s.title}`}>
                <div className="card lift h-step">
                  <div className="h-step-top">
                    <span className="h-step-no grad-text" aria-hidden="true">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="h-step-icon" aria-hidden="true">
                      <Icon name={ICONS[i] ?? "check"} size={22} />
                    </span>
                  </div>
                  <h3 className="h-step-title">
                    <span className="sr-only">{i + 1}. </span>
                    {s.title}
                  </h3>
                  <p className="h-step-body">{s.body}</p>
                </div>
                {i < items.length - 1 && (
                  <span className="h-step-arrow" aria-hidden="true">
                    <Icon name="chevron" size={18} />
                  </span>
                )}
              </StaggerItem>
            ))}
          </Stagger>
        </div>
        <LocationActions content={content} className="h-steps-actions" />
      </div>
    </section>
  );
}
