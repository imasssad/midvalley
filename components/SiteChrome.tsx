// The public website's frame around a page: skip link, header, <main>, footer, the business data for search
// engines and Google Tag Manager. Used by app/(site)/layout.tsx for every public page and by app/not-found.tsx
// (which renders outside the route group). The admin panel (app/admin) never gets any of this.
import { Footer } from "./Footer";
import { Gtm, GtmNoScript } from "./Gtm";
import { Header } from "./Header";
import { LocalBusinessJsonLd } from "./LocalBusinessJsonLd";
import { Ready } from "./motion/Ready";
import { getSiteContent, getYear } from "@/lib/content";

export async function SiteChrome({ children }: { children: React.ReactNode }) {
  const [content, year] = await Promise.all([getSiteContent(), getYear()]);
  return (
    <>
      <GtmNoScript />
      <a className="skip-link" href="#main">
        {content.labels.skipToContent}
      </a>
      <Header content={content} />
      <main id="main" tabIndex={-1}>
        {children}
      </main>
      <Footer content={content} year={year} />
      <Ready />
      <LocalBusinessJsonLd content={content} />
      <Gtm />
    </>
  );
}
