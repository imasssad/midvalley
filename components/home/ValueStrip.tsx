// The four short selling points under the promo ("Upfront, flat rate", ...): four glossy rounded tiles (.card;
// 4 across, 2x2 on tablet and phone), each with its icon in a blue chip (like the location cards), a small blue
// decorative number and the text in condensed caps. A plain list, not headings. Hidden when the admin turns it off or empties it.
// Motion: the cells fade and rise in one after another when the strip scrolls into view (Stagger).
import { Icon } from "@/components/Icon";
import { Stagger, StaggerItem } from "@/components/motion/Reveal";
import type { SiteContent } from "@/lib/content-schema";

export function ValueStrip({ content }: { content: SiteContent }) {
  const { valueStrip } = content;
  if (!valueStrip.enabled || valueStrip.items.length === 0) return null;
  return (
    <div className="h-values">
      <div className="wrap">
        <Stagger as="ul" className="h-values-list" gap={0.1}>
          {valueStrip.items.map((item, i) => (
            <StaggerItem as="li" className="h-value-item" key={`${i}-${item.text}`}>
              {/* The card face sits inside the animated item: Motion owns the item's transform. */}
              <span className="h-value card">
                <span className="h-value-top" aria-hidden="true">
                  <span className="h-value-chip">
                    <Icon name={item.icon} size={22} />
                  </span>
                  <span className="h-value-no">{String(i + 1).padStart(2, "0")}</span>
                </span>
                <span className="h-value-text">{item.text}</span>
              </span>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </div>
  );
}
