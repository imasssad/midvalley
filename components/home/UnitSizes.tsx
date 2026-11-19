// "Storage Sizes": the unit sizes per kind of storage (content.unitSizes.groups: Regular Storage, Parking, Climate
// Control), exactly as the client typed them. Shown in two places:
// - the homepage, right after Storage Options (placement "home", while `enabled`): the numbered section pill, the
//   heading, the cards, then one orange Rent Online button per location that has a rent link (the same links and
//   label as the rest of the site; not tied to any one kind of storage);
// - the Facility Features page, after the feature rows and before the closing band (placement "features", while
//   `showOnFeatures`): the same heading and cards, without a number pill (that page doesn't use them) and without the
//   buttons (the closing "Reserve at" band right under it does that job).
// Each kind of storage is one glossy rounded card: its name (h3, condensed caps), a small glossy count badge
// (decorative: the list says how many sizes it holds), then its sizes as glossy tiles in a wrapping grid (<ul>).
// Desktop: three equal cards side by side; tablet: two columns, an odd card out (the first, longest list) full width
// on top; phones: one column. Renders nothing while switched off for that page or no kind of storage has a size.
// Motion: heading rises in (Reveal), the cards come in one after another (Stagger), and inside each card the tiles
// pop in one after another (PopGroup/PopItem); the buttons rise in last. Transform and opacity only; reduced motion
// shows everything at once (app/globals.css). Tiles get a glossy rim on hover (CSS, opacity only).
import { Icon } from "@/components/Icon";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/Reveal";
import { NewTabNote } from "@/components/NewTab";
import type { SiteContent } from "@/lib/content-schema";
import { externalLinkProps } from "@/lib/links";
import { PopGroup, PopItem } from "./Pop";

export type SizesPlacement = "home" | "features";

/** Every kind of storage that has a name and at least one size, sizes trimmed, in the client's order. */
function sizeGroups(content: SiteContent) {
  const groups = content.unitSizes?.groups ?? [];
  return groups
    .map((g) => ({ name: g.name.trim(), sizes: g.sizes.map((s) => s.trim()).filter(Boolean) }))
    .filter((g) => g.name && g.sizes.length > 0);
}

/** The kinds of storage a page shows: none while the section is switched off for that page. */
export function visibleSizeGroups(content: SiteContent, placement: SizesPlacement = "home") {
  const s = content.unitSizes;
  if (!s) return [];
  const on = placement === "home" ? s.enabled : s.showOnFeatures !== false;
  return on ? sizeGroups(content) : [];
}

type Props = {
  content: SiteContent;
  /** The homepage's section number ("04"). Not used on the Facility Features page. */
  no?: string;
  placement?: SizesPlacement;
  /** The section's ground: white (default) or mist, so it can stand apart from the section above it. */
  ground?: "white" | "mist";
};

export function UnitSizes({ content, no, placement = "home", ground = "white" }: Props) {
  const groups = visibleSizeGroups(content, placement);
  if (groups.length === 0) return null;
  const onHome = placement === "home";
  const { header, labels } = content;
  const rentable = onHome ? content.locations.items.filter((l) => l.rentOnlineUrl) : [];
  const prefix = onHome ? "home-sizes" : "ff-sizes";
  const cols = Math.min(groups.length, 3);
  const grid = ["h-sizes-grid", `is-cols-${cols}`, groups.length % 2 === 1 && groups.length > 1 ? "is-odd" : ""].filter(Boolean).join(" ");

  return (
    <section
      id="storage-sizes"
      className={["section", ground === "mist" ? "bg-sand" : "bg-bone", "h-sizes", onHome ? "" : "ff-sizes"].filter(Boolean).join(" ")}
      aria-labelledby={`${prefix}-heading`}
    >
      <span className="glow-blob h-sizes-blob" aria-hidden="true" />
      <span className="glow-blob h-sizes-blob-2" aria-hidden="true" />
      <div className="wrap h-layer">
        <Reveal className="sec-head">
          {onHome && no && (
            <span className="sec-no" aria-hidden="true">
              {no}
            </span>
          )}
          <h2 id={`${prefix}-heading`} className="grad-text">
            {content.unitSizes.heading}
          </h2>
        </Reveal>
        <div className="h-sizes-stage">
          <span className="dots h-sizes-dots" aria-hidden="true" />
          <Stagger className={grid} gap={0.12}>
            {groups.map((g, i) => {
              const nameId = `${prefix}-group-${i + 1}`;
              return (
                <StaggerItem className="h-sizes-item" key={`${i}-${g.name}`}>
                  {/* The card face sits inside the animated item: Motion owns the item's transform. */}
                  <div className="card h-size-card">
                    <div className="h-size-head">
                      <h3 id={nameId} className="h-size-name">
                        {g.name}
                      </h3>
                      <span className="h-size-count" aria-hidden="true">
                        {g.sizes.length}
                      </span>
                    </div>
                    <PopGroup as="ul" className="h-size-list" gap={Math.min(0.05, 0.9 / g.sizes.length)} delay={0.15}>
                      {g.sizes.map((size, j) => (
                        <PopItem as="li" className="h-size-tile" key={`${j}-${size}`}>
                          {size}
                        </PopItem>
                      ))}
                    </PopGroup>
                  </div>
                </StaggerItem>
              );
            })}
          </Stagger>
        </div>
        {rentable.length > 0 && (
          <Reveal className="h-sizes-actions" delay={0.1}>
            {rentable.map((l) => (
              /* rentOnlineUrl: the location's Storedge move-in link (confirmed by the client). */
              <a key={l.id} className="btn btn-cta h-sizes-btn" href={l.rentOnlineUrl} {...externalLinkProps(l.rentOnlineUrl)}>
                <Icon name="key" />
                <span>{header.rentLabel}</span>
                <span className="h-sizes-btn-loc">
                  <span className="sr-only">: </span>
                  {l.name}
                </span>
                <NewTabNote text={labels.newTab} />
              </a>
            ))}
          </Reveal>
        )}
      </div>
    </section>
  );
}
