// "Storage Options" on mist: section number and heading, then the three kinds of storage as a numbered list of
// glossy rounded cards (.card: big blue number, title, text) beside a 2x2 grid of rounded facility photos that
// open the lightbox. Stacked from 1100px down. Motion: heading rises in, index rows come in one after another (Stagger),
// each photo is uncovered by a sliding curtain (Curtain, delays 0 / .1 / .2 / .3s) inside components/home/Gallery.
import { Reveal, Stagger, StaggerItem } from "@/components/motion/Reveal";
import type { SiteContent } from "@/lib/content-schema";
import { Gallery } from "./Gallery";

export function StorageOptions({ content, no }: { content: SiteContent; no: string }) {
  const { storageOptions } = content.home;
  return (
    <section id="storage-options" className="section bg-sand h-options" aria-labelledby="home-options-heading">
      <div className="wrap">
        <Reveal className="sec-head">
          <span className="sec-no" aria-hidden="true">
            {no}
          </span>
          <h2 id="home-options-heading">{storageOptions.heading}</h2>
        </Reveal>
        <div className="h-options-grid">
          <Stagger as="ol" className="h-index" gap={0.12}>
            {storageOptions.items.map((item, i) => (
              <StaggerItem as="li" className="h-index-item" key={`${i}-${item.title}`}>
                {/* The card face sits inside the animated item: Motion owns the item's transform. */}
                <div className="h-index-row card">
                  <span className="h-index-no" aria-hidden="true">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="h-index-body">
                    <h3>{item.title}</h3>
                    <p>{item.text}</p>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
          {storageOptions.gallery.length > 0 && (
            <div className="h-options-gallery">
              <Gallery photos={storageOptions.gallery} labels={content.labels} dialogLabel={storageOptions.heading} />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
