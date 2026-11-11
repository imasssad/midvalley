// Google Tag Manager. The container id comes from NEXT_PUBLIC_GTM_ID (GTM-TBHW45PH on the old site, see
// .env.example). Unset or malformed: nothing is rendered and no tracking loads.
import Script from "next/script";

function gtmId(): string | null {
  const id = process.env.NEXT_PUBLIC_GTM_ID?.trim();
  return id && /^GTM-[A-Z0-9]+$/.test(id) ? id : null;
}

/** The GTM loader. Goes at the end of <body> (app/layout.tsx). */
export function Gtm() {
  const id = gtmId();
  if (!id) return null;
  // Trade-off: "lazyOnload" injects GTM only when the browser is idle after the page has loaded, so tags never
  // compete with the page's own JavaScript, fonts or banner image on a phone (better LCP and INP). The cost is
  // that a visitor who leaves within the first second or two may not be counted, and tags fire a little later
  // than with GTM's standard <head> snippet. For a small local business site, speed for searchers comes first.
  return (
    <Script id="gtm" strategy="lazyOnload">
      {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${id}');`}
    </Script>
  );
}

/** GTM's no-JavaScript fallback. Goes right after <body> opens (app/layout.tsx). */
export function GtmNoScript() {
  const id = gtmId();
  if (!id) return null;
  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${id}`}
        height="0"
        width="0"
        style={{ display: "none", visibility: "hidden" }}
        title="Google Tag Manager"
      />
    </noscript>
  );
}
