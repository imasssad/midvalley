import { Suspense } from "react";
import { AdminNav, type NavGroup } from "@/components/admin/AdminNav";
import { requireUser, type Role } from "@/lib/auth";
import { listMessages } from "@/lib/messages";
import { groupTitles, screenKeys, screens, type ScreenGroup } from "@/lib/screens";

// The menu: the most used screens first, then one screen per page, then what every page shares, then the tools.
function navGroups(role: Role): NavGroup[] {
  const of = (group: ScreenGroup) =>
    screenKeys.filter((k) => screens[k].group === group && (!screens[k].ownerOnly || role === "owner")).map((k) => ({ href: `/admin/${k}`, label: screens[k].title }));
  return [
    { label: "", items: [{ href: "/admin", label: "Start here" }] },
    { label: groupTitles.top, items: of("top") },
    { label: groupTitles.pages, items: of("pages") },
    { label: groupTitles.site, items: of("site") },
    {
      label: "Tools",
      items: [
        { href: "/admin/messages", label: "Messages", badge: "messages" },
        { href: "/admin/history", label: "Change history & undo" },
        ...(role === "owner" ? [{ href: "/admin/users", label: "People who can sign in" }] : []),
        { href: "/admin/account", label: "Your account" },
      ],
    },
  ];
}

/** How many contact form messages haven't been read yet (shown next to Messages in the menu). */
async function UnreadBadge() {
  const unread = (await listMessages(100).catch(() => [])).filter((m) => !m.read).length;
  if (!unread) return null;
  return (
    <span className="nav-badge">
      {unread}
      <span className="sr-only-admin"> unread</span>
    </span>
  );
}

// Reading the session cookie is request-time work, so the whole panel renders inside a Suspense boundary.
export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="admin-loading">Loading…</div>}>
      <Shell>{children}</Shell>
    </Suspense>
  );
}

async function Shell({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <div className="admin-shell admin-ui">
      <a className="admin-skip" href="#admin-main">
        Skip to the editor
      </a>
      <aside className="admin-side">
        <a className="admin-brand" href="/admin">
          {/* eslint-disable-next-line @next/next/no-img-element -- the site's SVG logo, shown as is */}
          <img src="/images/logo.svg" alt="" width={166} height={96} />
          <span>Website editor</span>
        </a>
        <AdminNav
          groups={navGroups(user.role)}
          user={{ name: user.name, role: user.role }}
          messagesBadge={
            <Suspense fallback={null}>
              <UnreadBadge />
            </Suspense>
          }
        />
        <a className="btn-admin secondary view-site" href="/" target="_blank" rel="noopener">
          View website ↗<span className="sr-only-admin"> (opens in a new tab)</span>
        </a>
      </aside>
      {/* The site's root layout already provides the page's <main>, so this is a plain region. */}
      <div className="admin-main" id="admin-main" tabIndex={-1}>
        {children}
      </div>
    </div>
  );
}
