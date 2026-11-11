// "Storage Options" on mist: the section pill and the heading in navy-to-blue gradient text, then a bento of the
// three kinds of storage as tall rounded photo cards. The photo fills the card (cropped around its focal point);
// a glass number chip sits top left and the title and full text sit at the bottom on a solid-enough navy
// gradient panel (white text, AA over any photo). Desktop: three tall cards, the middle one set lower for rhythm;
// tablet: the first card wide on top, the other two side by side; phones: one column with the photo on top and
// the text on a navy panel below it. A card without a photo is a plain navy card. Under the bento, the facility
// photos as a row of four rounded thumbnails on a white glass strip (2x2 on phones) that open the lightbox
// (components/home/Gallery.tsx).
// Motion: heading rises in (Reveal); the cards rise in one after another (Stagger) while each photo is uncovered by
// a navy sliding curtain (Curtain); on hover a card lifts onto a blue glow and its photo zooms to 1.06 (CSS); the
// thumbnails rise in (Reveal) and get their own curtains (Gallery).
import { Curtain } from "@/components/motion/Curtain";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/Reveal";
import { Photo } from "@/components/Photo";
import type { SiteContent } from "@/lib/content-schema";
import { Gallery } from "./Gallery";

const SIZES_WIDE = "(max-width: 1100px) 92vw, (max-width: 1500px) 31vw, 460px";
const SIZES = "(max-width: 680px) 92vw, (max-width: 1100px) 46vw, (max-width: 1500px) 31vw, 460px";

export function StorageOptions({ content, no }: { content: SiteContent; no: string }) {
  const { storageOptions } = content.home;
  return (
    <section id="storage-options" className="section bg-sand h-options" aria-labelledby="home-options-heading">
      <span className="glow-blob h-options-blob" aria-hidden="true" />
      <div className="wrap h-layer">
        <Reveal className="sec-head">
          <span className="sec-no" aria-hidden="true">
            {no}
          </span>
          <h2 id="home-options-heading" className="grad-text">
            {storageOptions.heading}
          </h2>
        </Reveal>
        <Stagger as="ol" className="h-opts" gap={0.12}>
          {storageOptions.items.map((item, i) => (
            <StaggerItem as="li" className="h-opt-item" key={`${i}-${item.title}`}>
              {/* The card face sits inside the animated item: Motion owns the item's transform. */}
              <div className={item.photo ? "h-opt" : "h-opt h-opt-plain dots"}>
                {item.photo && (
                  <div className="h-opt-media">
                    <Curtain className="h-opt-curtain" color="ink" delay={0.1 + i * 0.12}>
                      <Photo photo={item.photo} className="h-fill h-opt-photo" sizes={i === 0 ? SIZES_WIDE : SIZES} />
                    </Curtain>
                  </div>
                )}
                <span className="h-opt-no" aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="h-opt-body">
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </div>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
        {storageOptions.gallery.length > 0 && (
          <Reveal className="h-options-gallery" delay={0.1}>
            <Gallery photos={storageOptions.gallery} labels={content.labels} dialogLabel={storageOptions.heading} />
          </Reveal>
        )}
      </div>
    </section>
  );
}
