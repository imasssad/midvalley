// Contact Us (/contact, same URL as the old site): title band, then two columns on desktop: the location cards
// (with the Google Maps embed under any location that has one: only Santa Fe on the old site) and the Instagram
// link on the left, the message form on the right. Stacked on tablets and phones.
import type { Metadata } from "next";
import { ContactForm } from "@/components/ContactForm";
import { Icon } from "@/components/Icon";
import { LocationCard } from "@/components/LocationCard";
import { NewTabNote } from "@/components/NewTab";
import { PageHero } from "@/components/PageHero";
import { getSiteContent } from "@/lib/content";
import { externalLinkProps } from "@/lib/links";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata("contact", "/contact");
}

export default async function ContactPage() {
  const content = await getSiteContent();
  const { contact, locations, business, footer, header, labels } = content;
  const instagram = business.instagramUrl;
  const opensNewTab = Boolean(externalLinkProps(instagram).target);

  return (
    <>
      <PageHero heading={contact.heading} photo={contact.heroPhoto} />

      <div className="section section-cream ct">
        <div className="wrap ct-grid">
          <div className="ct-info">
            {locations.items.map((l, i) => (
              <div
                key={l.id}
                className="ct-loc"
                data-reveal
                style={{ "--reveal-delay": `${Math.min(i, 3) * 100}ms` } as React.CSSProperties}
              >
                <LocationCard location={l} content={content} headingLevel="h2" />
                {l.mapEmbedUrl && (
                  <div className="ct-map">
                    <iframe
                      src={l.mapEmbedUrl}
                      title={`Map of ${l.name}`}
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  </div>
                )}
              </div>
            ))}

            {instagram && (
              <section className="ct-follow" aria-labelledby="ct-follow-heading" data-reveal>
                <h2 id="ct-follow-heading">{footer.followHeading}</h2>
                <a className="ct-social" href={instagram} {...externalLinkProps(instagram)}>
                  <Icon name="instagram" size={26} />
                  <span>{labels.instagram}</span>
                  {opensNewTab && <NewTabNote text={labels.newTab} />}
                </a>
              </section>
            )}
          </div>

          <section className="ct-form-card" aria-labelledby="ct-form-heading" data-reveal>
            <h2 id="ct-form-heading">{contact.formHeading}</h2>
            <ContactForm
              locations={locations.items.map((l) => ({ name: l.name, phone: l.phone }))}
              submitLabel={contact.submitLabel}
              callWord={header.mobileCallWord}
              fields={contact.fields}
              messages={contact.messages}
              requiredLabel={labels.required}
            />
          </section>
        </div>
      </div>
    </>
  );
}
