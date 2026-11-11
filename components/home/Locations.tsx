// "Our Locations", moved up right under the value strip: section number on a rule, the heading, then the two
// location tickets side by side (one column on phones). Motion: the heading block rises in, then the tickets
// come in one after another (Stagger); each ticket lifts onto its offset block on hover (.card.lift, CSS).
import { LocationCard } from "@/components/LocationCard";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/Reveal";
import type { SiteContent } from "@/lib/content-schema";

export function Locations({ content, no }: { content: SiteContent; no: string }) {
  return (
    <section id="locations" className="section bg-bone h-locations" aria-labelledby="home-locations-heading">
      <div className="wrap">
        <Reveal className="sec-head">
          <span className="sec-no" aria-hidden="true">
            {no}
          </span>
          <h2 id="home-locations-heading">{content.home.locations.heading}</h2>
        </Reveal>
        <Stagger className="h-loc-grid" gap={0.14}>
          {content.locations.items.map((l, i) => (
            <StaggerItem className="h-loc-item" key={l.id}>
              <LocationCard location={l} content={content} index={i} />
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
