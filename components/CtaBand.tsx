// Closing call to action on a charcoal band: a huge condensed heading, then one column per location with its
// rent button and call button, rising in one after another. variant "reserve" labels the rent buttons
// "Reserve at <location>" (About, Facility Features, as on the old site); "rent" uses "Rent Online" (homepage).
import type { SiteContent } from "@/lib/content-schema";
import { phoneHref } from "@/lib/format";
import { externalLinkProps } from "@/lib/links";
import { Icon } from "./Icon";
import { Reveal, Stagger, StaggerItem } from "./motion/Reveal";
import { NewTabNote } from "./NewTab";

type Props = { content: SiteContent; heading: string; variant: "rent" | "reserve"; id?: string };

export function CtaBand({ content, heading, variant, id = "get-started" }: Props) {
  const { locations, header, about, labels } = content;
  return (
    <section className="cta-band bg-ink" aria-labelledby={id}>
      <div className="wrap cta-inner">
        <Reveal className="cta-head">
          <h2 id={id} className="cta-title">
            {heading}
          </h2>
        </Reveal>
        <Stagger className="cta-groups" gap={0.12}>
          {locations.items.map((l, i) => (
            <StaggerItem className="cta-group" key={l.id}>
              <p className="cta-loc">
                <span aria-hidden="true">{String(i + 1).padStart(2, "0")}</span> {l.name}
              </p>
              {/* PLACEHOLDER (to confirm): rentOnlineUrl is the old QuikStor reserve link until the client confirms it. */}
              {l.rentOnlineUrl && (
                <a className="btn btn-cta btn-block" href={l.rentOnlineUrl} {...externalLinkProps(l.rentOnlineUrl)}>
                  <Icon name="key" />
                  {variant === "reserve" ? `${about.reserveWord} ${l.name}` : header.rentLabel}
                  {variant === "rent" && <span className="sr-only">: {l.name}</span>}
                  <NewTabNote text={labels.newTab} />
                </a>
              )}
              <a className="btn btn-light btn-block" href={phoneHref(l.phone)}>
                <Icon name="phone" />
                {header.mobileCallWord} {l.phone}
                <span className="sr-only">: {l.name}</span>
              </a>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
