// One location as a "ticket": a blue band with the location name, then address, a big phone number, hours and
// the actions. Used on the homepage and the Contact page. Lifts onto an offset block on hover (.card.lift).
import type { Location, SiteContent } from "@/lib/content-schema";
import { cityLine, phoneHref } from "@/lib/format";
import { externalLinkProps } from "@/lib/links";
import { Icon } from "./Icon";
import { NewTabNote } from "./NewTab";

type Props = { location: Location; content: SiteContent; headingLevel?: "h2" | "h3"; index?: number };

export function LocationCard({ location: l, content, headingLevel: H = "h3", index }: Props) {
  const { header, labels } = content;
  const newTab = <NewTabNote text={labels.newTab} />;
  return (
    <article className="loc card lift" aria-labelledby={`loc-${l.id}`}>
      <div className="loc-top">
        {index !== undefined && (
          <span className="loc-no" aria-hidden="true">
            {String(index + 1).padStart(2, "0")}
          </span>
        )}
        <H id={`loc-${l.id}`} className="loc-name">
          {l.name}
        </H>
      </div>
      <div className="loc-body">
        <dl className="loc-facts">
          <div className="loc-fact">
            <dt className="sr-only">Address</dt>
            <dd>
              <Icon name="pin" />
              {l.mapsUrl ? (
                <a href={l.mapsUrl} {...externalLinkProps(l.mapsUrl)} className="loc-addr">
                  <span>
                    {l.address.street}
                    <br />
                    {cityLine(l.address)}
                  </span>
                  {newTab}
                </a>
              ) : (
                <span className="loc-addr">
                  {l.address.street}
                  <br />
                  {cityLine(l.address)}
                </span>
              )}
            </dd>
          </div>
          <div className="loc-fact">
            <dt className="sr-only">Phone</dt>
            <dd>
              <Icon name="phone" />
              <a href={phoneHref(l.phone)} className="loc-phone">
                {l.phone}
              </a>
            </dd>
          </div>
          {l.gateHours && (
            <div className="loc-fact loc-hours">
              <dt>
                <Icon name="clock" />
                {labels.gateHours}
              </dt>
              <dd>{l.gateHours}</dd>
            </div>
          )}
          {/* PLACEHOLDER: office hours are unknown; this shows only once the admin fills them in. */}
          {l.officeHours && (
            <div className="loc-fact loc-hours">
              <dt>
                <Icon name="clock" />
                {labels.officeHours}
              </dt>
              <dd>{l.officeHours}</dd>
            </div>
          )}
        </dl>
        <div className="loc-actions">
          {/* PLACEHOLDER (to confirm): rentOnlineUrl is the old QuikStor reserve link until the client confirms it. */}
          {l.rentOnlineUrl && (
            <a className="btn btn-cta" href={l.rentOnlineUrl} {...externalLinkProps(l.rentOnlineUrl)}>
              <Icon name="key" />
              {header.rentLabel}
              <span className="sr-only">: {l.name}</span>
              {newTab}
            </a>
          )}
          <a className="btn btn-ink" href={l.paymentUrl} {...externalLinkProps(l.paymentUrl)}>
            <Icon name="card" />
            {header.paymentLabel}
            <span className="sr-only">: {l.name}</span>
            {newTab}
          </a>
          {l.mapsUrl && (
            <a className="link-draw loc-dir" href={l.mapsUrl} {...externalLinkProps(l.mapsUrl)}>
              <Icon name="map" />
              {labels.directions}
              <span className="sr-only">: {l.name}</span>
              {newTab}
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
