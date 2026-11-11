// "Our Locations": one card per location (address, phone, gate hours, Rent Online, Make a payment, directions).
// Two columns, one on phones. Light blue ground so this key section stands out before the closing CTA band.
import { LocationCard } from "@/components/LocationCard";
import type { SiteContent } from "@/lib/content-schema";

export function HomeLocations({ content }: { content: SiteContent }) {
  return (
    <section id="locations" className="section home-locations" aria-labelledby="home-locations-heading">
      <div className="wrap">
        <h2 id="home-locations-heading" className="home-heading" data-reveal>
          {content.home.locations.heading}
        </h2>
        <div className="locations-grid">
          {content.locations.items.map((l, i) => (
            <div key={l.id} data-reveal style={{ "--reveal-delay": `${i * 120}ms` } as React.CSSProperties}>
              <LocationCard location={l} content={content} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
