// Closing call to action: the page's "Ready to get started?" heading, a rent button per location and the
// call buttons. variant "reserve" labels the rent buttons "Reserve at <location>" (About, Facility Features,
// as on the old site); "rent" uses the header's "Rent Online" label with the location's name (homepage).
import type { SiteContent } from "@/lib/content-schema";
import { phoneHref } from "@/lib/format";
import { externalLinkProps } from "@/lib/links";
import { Icon } from "./Icon";
import { NewTabNote } from "./NewTab";

type Props = { content: SiteContent; heading: string; variant: "rent" | "reserve"; id?: string };

export function CtaBand({ content, heading, variant, id = "get-started" }: Props) {
  const { locations, header, about, labels } = content;
  return (
    <section className="cta-band section-navy on-navy" aria-labelledby={id}>
      <div className="wrap cta-inner" data-reveal>
        <h2 id={id}>{heading}</h2>
        <div className="cta-groups">
          {locations.items.map((l) => (
            <div className="cta-group" key={l.id}>
              <p className="cta-loc">{l.name}</p>
              {/* PLACEHOLDER (to confirm): rentOnlineUrl is the old QuikStor reserve link until the client confirms it. */}
              {l.rentOnlineUrl && (
                <a className="btn btn-orange" href={l.rentOnlineUrl} {...externalLinkProps(l.rentOnlineUrl)}>
                  <Icon name="key" />
                  {variant === "reserve" ? `${about.reserveWord} ${l.name}` : header.rentLabel}
                  {variant === "rent" && <span className="sr-only">: {l.name}</span>}
                  <NewTabNote text={labels.newTab} />
                </a>
              )}
              <a className="btn btn-outline" href={phoneHref(l.phone)}>
                <Icon name="phone" />
                {header.mobileCallWord} {l.phone}
                <span className="sr-only">: {l.name}</span>
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
