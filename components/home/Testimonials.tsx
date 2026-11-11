// Customer reviews. Hidden until the admin adds reviews (the old site's section was empty, and we never invent
// any): renders nothing while content.testimonials.items is empty.
import type { SiteContent } from "@/lib/content-schema";

export function Testimonials({ content }: { content: SiteContent }) {
  const { testimonials } = content;
  if (testimonials.items.length === 0) return null;
  return (
    <section className="section home-testimonials" aria-labelledby="home-testimonials-heading">
      <div className="wrap">
        <h2 id="home-testimonials-heading" className="home-heading" data-reveal>
          {testimonials.heading}
        </h2>
        <ul className="testimonials-grid">
          {testimonials.items.map((t, i) => (
            <li key={`${i}-${t.name}`} data-reveal style={{ "--reveal-delay": `${(i % 3) * 100}ms` } as React.CSSProperties}>
              <figure className="testimonial">
                <blockquote>
                  <p>{t.quote}</p>
                </blockquote>
                <figcaption>{t.name}</figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
