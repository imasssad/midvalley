// Customer reviews. Hidden until the admin adds reviews (the old site's section was empty, and we never invent
// any): renders nothing while content.testimonials.items is empty. When there are reviews: section number and
// heading, then square white cards on hairlines (3 across, 1 on phones) that lift on hover.
// Motion: heading rises in (Reveal), the cards come in one after another (Stagger).
import { Reveal, Stagger, StaggerItem } from "@/components/motion/Reveal";
import type { SiteContent } from "@/lib/content-schema";

export function Testimonials({ content, no }: { content: SiteContent; no: string }) {
  const { testimonials } = content;
  if (testimonials.items.length === 0) return null;
  return (
    <section className="section bg-bone h-reviews" aria-labelledby="home-testimonials-heading">
      <div className="wrap">
        <Reveal className="sec-head">
          <span className="sec-no" aria-hidden="true">
            {no}
          </span>
          <h2 id="home-testimonials-heading">{testimonials.heading}</h2>
        </Reveal>
        <Stagger as="ul" className="h-reviews-grid" gap={0.1}>
          {testimonials.items.map((t, i) => (
            <StaggerItem as="li" className="h-review-item" key={`${i}-${t.name}`}>
              <figure className="h-review card lift">
                <span className="h-review-mark" aria-hidden="true">
                  “
                </span>
                <blockquote>
                  <p>{t.quote}</p>
                </blockquote>
                <figcaption>{t.name}</figcaption>
              </figure>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
