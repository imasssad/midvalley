// The Rent Online and Call buttons for every location, as on Storage Sizes: an orange "Rent Online | Visalia
// Noble" button per location that has a rent link (new tab), and a white "Call (559) 734-7368 | Noble" button per
// location (tel:), one row per location. Used under the three steps (both) and under the questions (calls only).
// Words and links come from Header & menu and Locations & contact. Rises in as one block (Reveal).
import { Icon } from "@/components/Icon";
import { Reveal } from "@/components/motion/Reveal";
import { NewTabNote } from "@/components/NewTab";
import type { SiteContent } from "@/lib/content-schema";
import { phoneHref } from "@/lib/format";
import { externalLinkProps } from "@/lib/links";

export function LocationActions({ content, rent = true, className }: { content: SiteContent; rent?: boolean; className?: string }) {
  const { header, labels, locations } = content;
  const pairs = rent && locations.items.some((l) => l.rentOnlineUrl);
  const cls = ["h-actions", pairs && "is-pairs", className].filter(Boolean).join(" ");
  return (
    <Reveal className={cls} delay={0.1}>
      {locations.items.map((l) => (
        <div className="h-actions-group" key={l.id}>
          {/* rentOnlineUrl: the location's Storedge move-in link (confirmed by the client). */}
          {rent && l.rentOnlineUrl && (
            <a className="btn btn-cta h-actions-btn" href={l.rentOnlineUrl} {...externalLinkProps(l.rentOnlineUrl)}>
              <Icon name="key" />
              <span>{header.rentLabel}</span>
              <span className="h-actions-loc">
                <span className="sr-only">: </span>
                {l.name}
              </span>
              <NewTabNote text={labels.newTab} />
            </a>
          )}
          <a className="btn btn-line h-actions-btn" href={phoneHref(l.phone)}>
            <Icon name="phone" />
            <span>
              {header.mobileCallWord} {l.phone}
            </span>
            <span className="h-actions-loc">
              <span className="sr-only">: </span>
              {l.shortName}
            </span>
          </a>
        </div>
      ))}
    </Reveal>
  );
}
