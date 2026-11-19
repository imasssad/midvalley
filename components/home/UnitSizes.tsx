// "Storage Sizes", right after Storage Options, on white: the section pill and the heading in navy-to-blue gradient
// text, then one glossy rounded card per kind of storage (content.unitSizes.groups: Regular Storage, Parking, Climate
// Control). Each card has the group's name in condensed caps, a small glossy count badge (decorative: the list says
// how many sizes it holds) and its optional note, then the sizes as glossy white pills in a tidy wrapping grid.
// Every size is shown exactly as typed ("10x12.5"); a pill whose size reads as "W x D" also gets a tiny floor-plan
// outline drawn to that shape (decorative). Desktop: the first (largest) group as a wide card on the left, the others
// stacked on the right; tablet: the first card full width, the others side by side below; phones: one column.
// Under the cards, one orange Rent Online button per location that has a rent link (the same links and label as the
// rest of the site), so a size can be acted on straight away.
// Renders nothing while the section is switched off or no group has a size.
// Motion: heading rises in (Reveal), the cards come in one after another (Stagger), and inside each card the pills
// pop in one after another (PopGroup/PopItem); the buttons rise in last. Pills get a glossy rim on hover (CSS).
import { Icon } from "@/components/Icon";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/Reveal";
import { NewTabNote } from "@/components/NewTab";
import type { SiteContent } from "@/lib/content-schema";
import { externalLinkProps } from "@/lib/links";
import { PopGroup, PopItem } from "./Pop";

/** The groups the website shows: those with at least one size, none while the section is switched off. */
export function visibleSizeGroups(content: SiteContent) {
  const { unitSizes } = content;
  if (!unitSizes?.enabled) return [];
  return unitSizes.groups
    .map((g) => ({ ...g, sizes: g.sizes.map((s) => s.trim()).filter(Boolean) }))
    .filter((g) => g.name.trim() && g.sizes.length > 0);
}

const DIMS = /^\s*(\d{1,3}(?:\.\d{1,2})?)\s*['′]?\s*[x×X]\s*(\d{1,3}(?:\.\d{1,2})?)\s*['′]?\s*$/;

/** The outline's width and depth as fractions of its box (longest side = 1), or null when the size isn't "W x D". */
function planShape(size: string): { w: number; d: number } | null {
  const m = DIMS.exec(size);
  if (!m) return null;
  const w = Number(m[1]);
  const d = Number(m[2]);
  if (!(w > 0 && d > 0)) return null;
  const max = Math.max(w, d);
  const r = (v: number) => Math.max(0.22, Math.round((v / max) * 100) / 100);
  return { w: r(w), d: r(d) };
}

export function UnitSizes({ content, no }: { content: SiteContent; no: string }) {
  const groups = visibleSizeGroups(content);
  if (groups.length === 0) return null;
  const { header, labels } = content;
  const rentable = content.locations.items.filter((l) => l.rentOnlineUrl);
  const layout = groups.length === 1 ? "h-sizes-grid is-single" : "h-sizes-grid";

  return (
    <section id="storage-sizes" className="section bg-bone h-sizes" aria-labelledby="home-sizes-heading">
      <span className="glow-blob h-sizes-blob" aria-hidden="true" />
      <span className="glow-blob h-sizes-blob-2" aria-hidden="true" />
      <div className="wrap h-layer">
        <Reveal className="sec-head">
          <span className="sec-no" aria-hidden="true">
            {no}
          </span>
          <h2 id="home-sizes-heading" className="grad-text">
            {content.unitSizes.heading}
          </h2>
        </Reveal>
        <div className="h-sizes-stage">
          <span className="dots h-sizes-dots" aria-hidden="true" />
          <Stagger className={layout} gap={0.12}>
            {groups.map((g, i) => {
              return (
                <StaggerItem
                  className="h-sizes-item"
                  key={`${i}-${g.name}`}
                  style={i === 0 ? ({ "--h-sizes-rest": Math.max(groups.length - 1, 1) } as React.CSSProperties) : undefined}
                >
                  {/* The card face sits inside the animated item: Motion owns the item's transform. */}
                  <div className="card h-size-card">
                    <div className="h-size-head">
                      <h3 className="h-size-name">
                        {g.name}
                      </h3>
                      <span className="h-size-count" aria-hidden="true">
                        {g.sizes.length}
                      </span>
                    </div>
                    {g.note.trim() && <p className="h-size-note">{g.note}</p>}
                    <PopGroup as="ul" className="h-size-list" gap={Math.min(0.04, 0.9 / g.sizes.length)} delay={0.15}>
                      {g.sizes.map((size, j) => {
                        const plan = planShape(size);
                        return (
                          <PopItem as="li" className="h-size-pill" key={`${j}-${size}`}>
                            {plan && (
                              <span className="h-size-plan" aria-hidden="true">
                                <span style={{ "--pw": plan.w, "--pd": plan.d } as React.CSSProperties} />
                              </span>
                            )}
                            <span className="h-size-text">{size}</span>
                          </PopItem>
                        );
                      })}
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
              /* PLACEHOLDER (to confirm): rentOnlineUrl is the old QuikStor reserve link until the client confirms it. */
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
