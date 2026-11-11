// One location: name, address, phone, hours and its actions. Used on the homepage and the Contact page.
import type { Location, SiteContent } from "@/lib/content-schema";
import { cityLine, phoneHref } from "@/lib/format";
import { externalLinkProps } from "@/lib/links";
import { Icon } from "./Icon";
import { NewTabNote } from "./NewTab";

type Props = { location: Location; content: SiteContent; headingLevel?: "h2" | "h3" };

export function LocationCard({ location: l, content, headingLevel: H = "h3" }: Props) {
  const { header, labels } = content;
  const newTab = <NewTabNote text={labels.newTab} />;
  return (
    <article className="loc-card" aria-labelledby={`loc-${l.id}`}>
      <H id={`loc-${l.id}`} className="loc-name">
        {l.name}
      </H>
      <dl className="loc-facts">
        <div>
          <dt className="sr-only">Address</dt>
          <dd>
            <Icon name="pin" />
            {l.mapsUrl ? (
              <a href={l.mapsUrl} {...externalLinkProps(l.mapsUrl)}>
                {l.address.street}
                <br />
                {cityLine(l.address)}
                {newTab}
              </a>
            ) : (
              <span>
                {l.address.street}
                <br />
                {cityLine(l.address)}
              </span>
            )}
          </dd>
        </div>
        <div>
          <dt className="sr-only">Phone</dt>
          <dd>
            <Icon name="phone" />
            <a href={phoneHref(l.phone)} className="loc-phone">
              {l.phone}
            </a>
          </dd>
        </div>
        {l.gateHours && (
          <div>
            <dt>
              <Icon name="clock" />
              {labels.gateHours}
            </dt>
            <dd className="loc-hours">{l.gateHours}</dd>
          </div>
        )}
        {/* PLACEHOLDER: office hours are unknown; this shows only once the admin fills them in. */}
        {l.officeHours && (
          <div>
            <dt>
              <Icon name="clock" />
              {labels.officeHours}
            </dt>
            <dd className="loc-hours">{l.officeHours}</dd>
          </div>
        )}
      </dl>
      <div className="loc-actions">
        {l.rentOnlineUrl && (
          <a className="btn btn-orange" href={l.rentOnlineUrl} {...externalLinkProps(l.rentOnlineUrl)}>
            <Icon name="key" />
            {header.rentLabel}
            <span className="sr-only">: {l.name}</span>
            {newTab}
          </a>
        )}
        <a className="btn btn-navy" href={l.paymentUrl} {...externalLinkProps(l.paymentUrl)}>
          <Icon name="card" />
          {header.paymentLabel}
          <span className="sr-only">: {l.name}</span>
          {newTab}
        </a>
        {l.mapsUrl && (
          <a className="link-arrow" href={l.mapsUrl} {...externalLinkProps(l.mapsUrl)}>
            <Icon name="map" />
            {labels.directions}
            <span className="sr-only">: {l.name}</span>
            {newTab}
          </a>
        )}
      </div>
    </article>
  );
}
