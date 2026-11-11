"use client";

// The page links (content.nav.items), used by the header's secondary nav row and the footer. Marks the current
// page with aria-current="page" (read from usePathname, so it needs a client component). NavLinksStatic is the
// same list without the current-page mark: the Suspense fallback in case the pathname is not known while
// prerendering (Cache Components, see node_modules/next/dist/docs/01-app/03-api-reference/04-functions/use-pathname.md).
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { SiteContent } from "@/lib/content-schema";
import { externalLinkProps } from "@/lib/links";
import { NewTabNote } from "./NewTab";

type NavItem = SiteContent["nav"]["items"][number];
/** newTabLabel: content.labels.newTab, read out after links that open another website in a new tab. */
type Props = { items: NavItem[]; className?: string; newTabLabel: string };

/** "/about-us" is current on "/about-us" and "/about-us/…"; "/" only on the homepage itself. */
function isCurrent(href: string, pathname: string | null): boolean {
  if (!pathname || !href.startsWith("/")) return false;
  const clean = (p: string) => (p.length > 1 ? p.replace(/\/+$/, "") : p);
  const h = clean(href);
  const p = clean(pathname);
  return h === "/" ? p === "/" : p === h || p.startsWith(`${h}/`);
}

function NavList({ items, className, newTabLabel, pathname }: Props & { pathname: string | null }) {
  return (
    <ul className={className} role="list">
      {items.map((item) => {
        const current = isCurrent(item.href, pathname);
        return (
          <li key={`${item.href}-${item.label}`}>
            {item.href.startsWith("/") ? (
              <Link href={item.href} aria-current={current ? "page" : undefined}>
                {item.label}
              </Link>
            ) : (
              <a href={item.href} {...externalLinkProps(item.href)}>
                {item.label}
                {externalLinkProps(item.href).target && <NewTabNote text={newTabLabel} />}
              </a>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export function NavLinks(props: Props) {
  const pathname = usePathname();
  return <NavList {...props} pathname={pathname} />;
}

export function NavLinksStatic(props: Props) {
  return <NavList {...props} pathname={null} />;
}
