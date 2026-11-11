// "Storage Options": the three kinds of storage as cards, then the facility photos as a gallery with a lightbox.
// Navy section, between the white About intro and the cream Facility Features.
import type { SiteContent } from "@/lib/content-schema";
import { Gallery } from "./Gallery";

export function StorageOptions({ content }: { content: SiteContent }) {
  const { storageOptions } = content.home;
  return (
    <section
      id="storage-options"
      className="section section-navy on-navy home-options"
      aria-labelledby="home-options-heading"
    >
      <div className="wrap">
        <h2 id="home-options-heading" className="home-heading" data-reveal>
          {storageOptions.heading}
        </h2>
        <ul className="options-grid">
          {storageOptions.items.map((item, i) => (
            <li
              key={`${i}-${item.title}`}
              className="option-card"
              data-reveal
              style={{ "--reveal-delay": `${i * 100}ms` } as React.CSSProperties}
            >
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </li>
          ))}
        </ul>
        {storageOptions.gallery.length > 0 && (
          <div className="options-gallery" data-reveal>
            <Gallery photos={storageOptions.gallery} labels={content.labels} dialogLabel={storageOptions.heading} />
          </div>
        )}
      </div>
    </section>
  );
}
