// The four short selling points under the promo ("Upfront, flat rate", ...) as one glossy NAVY rounded bar inside
// the page width (dot texture, inner gloss): each item has a glowing round white icon chip (blue icon) and the
// text in white condensed caps, with soft glowing lines between items. 4 across; 2x2 on tablet; a stacked list on
// phones. The bar straddles the white/mist edge into About (the strip's ground is half white, half mist). A plain
// list, not headings. Hidden when the admin turns it off or empties it.
// Motion: the items pop in one after another when the bar scrolls into view (PopGroup/PopItem: scale .9 -> 1 and
// opacity, spring); the icon chips' glow brightens on hover (CSS).
import { Icon } from "@/components/Icon";
import type { SiteContent } from "@/lib/content-schema";
import { PopGroup, PopItem } from "./Pop";

export function ValueStrip({ content }: { content: SiteContent }) {
  const { valueStrip } = content;
  if (!valueStrip.enabled || valueStrip.items.length === 0) return null;
  return (
    <div className="h-values">
      <div className="wrap">
        <div className="h-values-bar bg-ink dots">
          <PopGroup as="ul" className="h-values-list" gap={0.1}>
            {valueStrip.items.map((item, i) => (
              <PopItem as="li" className="h-value-item" key={`${i}-${item.text}`}>
                <span className="h-value-chip" aria-hidden="true">
                  <Icon name={item.icon} size={22} />
                </span>
                <span className="h-value-text">{item.text}</span>
              </PopItem>
            ))}
          </PopGroup>
        </div>
      </div>
    </div>
  );
}
