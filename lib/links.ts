// Links to other websites (Storedge, QuikStor, Google Maps, Instagram) open in a new tab, so the website stays
// open behind them. Links within this site and tel: links open normally.
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://midvalleystorage.com";
const ownHost = new URL(SITE_URL).hostname.replace(/^www\./, "");

export function externalLinkProps(href: string): { target?: "_blank"; rel?: string } {
  if (!/^https?:\/\//i.test(href)) return {};
  try {
    if (new URL(href).hostname.replace(/^www\./, "") === ownHost) return {};
  } catch {
    return {};
  }
  return { target: "_blank", rel: "noopener" };
}
