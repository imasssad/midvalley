// "Questions, answered." (FAQ), after Security, on mist. Desktop: the section pill, the heading (navy-to-blue
// gradient text) and the intro on the left with the Call buttons under them; the questions on the right. Tablet and
// phones: heading, questions, then the Call buttons. Each question is a native <details>/<summary> (works without
// JavaScript, keyboard and screen readers get a real disclosure): a glossy rounded card with the question in
// condensed caps and a glossy round + chip that turns into × when open (transform only). All closed at first. Where
// the browser supports it the answer slides open (CSS ::details-content + interpolate-size); otherwise it opens at
// once. Every word comes from content.home.faq; renders nothing while switched off or without questions.
// FaqJsonLd gives the same questions to search engines as schema.org FAQPage data (homepage only).
// Motion: heading rises in (Reveal), the cards come in one after another (Stagger), the buttons rise in last.
import { Reveal, Stagger, StaggerItem } from "@/components/motion/Reveal";
import type { SiteContent } from "@/lib/content-schema";
import { LocationActions } from "./LocationActions";
import { visibleFaq } from "./sectionNumbers";

export function Faq({ content, no }: { content: SiteContent; no: string }) {
  const items = visibleFaq(content);
  if (items.length === 0) return null;
  const { faq } = content.home;
  return (
    <section id="faq" className="section bg-sand h-faq" aria-labelledby="home-faq-heading">
      <span className="glow-blob h-faq-blob" aria-hidden="true" />
      <div className="wrap h-layer h-faq-grid">
        <Reveal className="h-faq-head">
          <div className="sec-head">
            <span className="sec-no" aria-hidden="true">
              {no}
            </span>
            <h2 id="home-faq-heading" className="grad-text">
              {faq.heading}
            </h2>
          </div>
          {faq.intro && <p className="lede h-faq-intro">{faq.intro}</p>}
        </Reveal>
        <Stagger className="h-faq-list" gap={0.06}>
          {items.map((f, i) => (
            // The card face sits on the Motion item (not on <details>, which draws its content through its own
            // internal slots); one element per question fewer than a separate wrapper.
            <StaggerItem className="card h-faq-card" key={`${i}-${f.q}`}>
              <details className="h-faq-item">
                <summary className="h-faq-q">
                  <span className="h-faq-q-text">{f.q}</span>
                  <span className="h-faq-toggle" aria-hidden="true" />
                </summary>
                <div className="h-faq-a">
                  <p>{f.a}</p>
                </div>
              </details>
            </StaggerItem>
          ))}
        </Stagger>
        <LocationActions content={content} rent={false} className="h-faq-actions" />
      </div>
    </section>
  );
}

/** schema.org FAQPage for the questions the homepage shows (nothing while the section is hidden). */
export function FaqJsonLd({ content }: { content: SiteContent }) {
  const items = visibleFaq(content);
  if (items.length === 0) return null;
  const data = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
  // "<" escaped so content can never close the script tag.
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
