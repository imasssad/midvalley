// Contact Us (/contact, same URL as the old site), in the "Valley glass" look:
// - Title block (PageHero) with each location's phone number as glass chips on the photo (decorative: the cards
//   below repeat them, so screen readers skip the chips); then
// - one mist section with a fading dot grid and soft glows. Desktop: two columns. Left: the glossy location cards
//   (LocationCard), the Google Maps embed in a glossy rounded frame (focus ring on the frame) with a glass chip
//   naming the location on its top edge, and "Follow Us" as a glossy blue tile with a dot texture and a big faint
//   Instagram mark. Right: the message form in a glossy card whose blue gradient top band holds the form heading
//   in white; it stays in view while the left column scrolls on tall desktop screens. Tablets: cards side by side,
//   the form below; phones: one column.
// Motion: the cards, map and Instagram tile come in one after another (Stagger); the form card rises in (Reveal).
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
      <PageHero
        heading={contact.heading}
        photo={contact.heroPhoto}
        chips={locations.items.map((l) => ({
          icon: "phone" as const,
          label: l.name,
          text: l.phone,
        }))}
        chipsDecorative
      />

      <div className="section bg-sand ct">
        <div className="pg-decor" aria-hidden="true">
          <span className="dots ct-dots" />
          <span className="glow-blob ct-blob" />
          <span className="glow-blob ct-blob-2" />
        </div>
        <div className="wrap ct-grid">
          <Stagger className="ct-info" gap={0.12}>
            {locations.items.map((l, i) => (
              <StaggerItem key={l.id} className="ct-loc">
                <LocationCard
                  location={l}
                  content={content}
                  headingLevel="h2"
                  index={i}
                />
                {l.mapEmbedUrl && (
                  <div className="ct-map card">
                    <span className="chip ct-map-chip" aria-hidden="true">
                      <span className="chip-dot">
                        <Icon name="pin" size={15} />
                      </span>
                      {l.name}
                    </span>
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
                <section
                  className="ct-follow bg-blue dots"
                  aria-labelledby="ct-follow-heading"
                >
                  <Icon
                    name="instagram"
                    size={200}
                    className="ct-follow-mark"
                  />
                  <h2 id="ct-follow-heading">{footer.followHeading}</h2>
                  <a
                    className="link-draw ct-social"
                    href={instagram}
                    {...externalLinkProps(instagram)}
                  >
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
              <div className="card-band ct-form-band">
                <span className="ct-form-icon" aria-hidden="true">
                  <Icon name="mail" size={22} />
                </span>
                <h2 id="ct-form-heading">{contact.formHeading}</h2>
              </div>
              <div className="ct-form-body">
                <ContactForm
                  locations={locations.items.map((l) => ({
                    name: l.name,
                    phone: l.phone,
                  }))}
                  submitLabel={contact.submitLabel}
                  callWord={header.mobileCallWord}
                  fields={contact.fields}
                  messages={contact.messages}
                  requiredLabel={labels.required}
                />
              </div>
            </section>
          </Reveal>
        </div>
      </div>
    </>
  );
}
