// The four short selling points under the promo banner ("Upfront, flat rate", ...), each with its icon.
// A compact blue band: a plain list, not headings. Hidden when the admin turns it off or empties it.
import { Icon } from "@/components/Icon";
import type { SiteContent } from "@/lib/content-schema";

export function ValueStrip({ content }: { content: SiteContent }) {
  const { valueStrip } = content;
  if (!valueStrip.enabled || valueStrip.items.length === 0) return null;
  return (
    <div className="value-strip">
      <div className="wrap-wide">
        <ul className="value-list">
          {valueStrip.items.map((item, i) => (
            <li className="value-item" key={`${i}-${item.text}`}>
              <span className="value-icon">
                <Icon name={item.icon} size={22} />
              </span>
              <span className="value-text">{item.text}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
