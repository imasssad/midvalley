// The four short selling points under the promo ("Upfront, flat rate", ...): a bone band of cells divided by
// hairlines (4 across, 2x2 on tablet and phone), each with a small decorative number, its icon and the text in
// condensed caps. A plain list, not headings. Hidden when the admin turns it off or empties it.
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
            <StaggerItem as="li" className="h-value" key={`${i}-${item.text}`}>
              <span className="h-value-top" aria-hidden="true">
                <span className="h-value-no">{String(i + 1).padStart(2, "0")}</span>
                <Icon name={item.icon} size={26} />
              </span>
              <span className="h-value-text">{item.text}</span>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </div>
  );
}
