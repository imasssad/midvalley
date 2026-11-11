// Contact Us (/contact, same URL as the old site): split title block, then two columns on desktop: on the left the
// numbered location tickets stacked (with the Google Maps embed in a square frame under any location that has one:
// only Santa Fe on the old site) and the Instagram link as a blue tile; on the right the message form in a white
// card with an orange top rule. Tickets side by side on tablets with the form below; one column on phones.
// Motion: the tickets, map and Instagram tile come in one after another; the form card rises in.
import type { Metadata } from "next";
import { ContactForm } from "@/components/ContactForm";
import { Icon } from "@/components/Icon";
import { LocationCard } from "@/components/LocationCard";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/Reveal";
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

      <div className="section bg-sand ct">
        <div className="wrap ct-grid">
          <Stagger className="ct-info" gap={0.12}>
            {locations.items.map((l, i) => (
              <StaggerItem key={l.id} className="ct-loc">
                <LocationCard location={l} content={content} headingLevel="h2" index={i} />
                {l.mapEmbedUrl && (
                  <div className="ct-map frame frame-ink">
                    <iframe
                      src={l.mapEmbedUrl}
                      title={`Map of ${l.name}`}
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  </div>
                )}
              </StaggerItem>
            ))}

            {instagram && (
              <StaggerItem className="ct-follow-item">
                <section className="ct-follow bg-blue" aria-labelledby="ct-follow-heading">
                  <h2 id="ct-follow-heading">{footer.followHeading}</h2>
                  <a className="link-draw ct-social" href={instagram} {...externalLinkProps(instagram)}>
                    <Icon name="instagram" size={28} />
                    <span>{labels.instagram}</span>
                    {opensNewTab && <NewTabNote text={labels.newTab} />}
                  </a>
                </section>
              </StaggerItem>
            )}
          </Stagger>

          <Reveal className="ct-form-wrap" delay={0.1}>
            <section className="ct-form card" aria-labelledby="ct-form-heading">
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
          </Reveal>
        </div>
      </div>
    </>
  );
}
