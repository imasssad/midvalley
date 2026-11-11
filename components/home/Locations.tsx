// "Our Locations", right after About, on white: the section pill and the heading in navy-to-blue gradient text,
// then the two glossy location cards side by side (one column on phones) floating over a soft glow blob and a
// fading dot-grid field.
// Motion: the heading block rises in, then the cards come in one after another (Stagger); each card lifts onto a
// soft blue glow on hover (.card.lift, CSS).
import { LocationCard } from "@/components/LocationCard";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/Reveal";
import type { SiteContent } from "@/lib/content-schema";

export function Locations({ content, no }: { content: SiteContent; no: string }) {
  return (
    <section id="locations" className="section bg-bone h-locations" aria-labelledby="home-locations-heading">
      <span className="glow-blob h-loc-blob" aria-hidden="true" />
      <span className="glow-blob h-loc-blob-2" aria-hidden="true" />
      <div className="wrap h-layer">
        <Reveal className="sec-head">
          <span className="sec-no" aria-hidden="true">
            {no}
          </span>
          <h2 id="home-locations-heading" className="grad-text">
            {content.home.locations.heading}
          </h2>
        </Reveal>
        <div className="h-loc-stage">
          <span className="dots h-loc-dots" aria-hidden="true" />
          <Stagger className="h-loc-grid" gap={0.14}>
            {content.locations.items.map((l, i) => (
              <StaggerItem className="h-loc-item" key={l.id}>
                <LocationCard location={l} content={content} index={i} />
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </div>
    </section>
  );
}
