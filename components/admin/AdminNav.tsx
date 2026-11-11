"use client";

// Sidebar on desktop, a "Menu" dropdown on phones. Plain links (full page loads) so the unsaved-changes warning
// always gets a chance to run.
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { logout } from "@/app/admin/actions";

export type NavItem = { href: string; label: string; /** Shown after the label, e.g. the unread message count. */ badge?: "messages" };
export type NavGroup = { label: string; items: NavItem[] };

export function AdminNav({ groups, user, messagesBadge }: { groups: NavGroup[]; user: { name: string; role: string }; messagesBadge?: ReactNode }) {
  const pathname = usePathname();
  const current = (href: string) => (href === "/admin" ? pathname === href : pathname === href || pathname?.startsWith(`${href}/`));
  const links = groups.map((g, gi) => (
    <div key={gi} className="nav-group">
      {g.label && (
        <p className="nav-label" aria-hidden="true">
          {g.label}
        </p>
      )}
      <ul aria-label={g.label || undefined}>
        {g.items.map((item) => (
          <li key={item.href}>
            <a href={item.href} aria-current={current(item.href) ? "page" : undefined}>
              {item.label}
              {item.badge === "messages" && messagesBadge}
            </a>
          </li>
        ))}
      </ul>
    </div>
  ));
  const signOut = (
    <form action={logout}>
      <button type="submit" className="link-btn">
        Sign out
      </button>
    </form>
  );
  return (
    <>
      <nav className="admin-nav" aria-label="Website editor">
        {links}
      </nav>
      <details className="admin-menu">
        <summary>Menu</summary>
        <nav aria-label="Website editor (menu)">
          {links.map((l, i) => (
            <div key={i}>{l}</div>
          ))}
          <div className="admin-user-mobile">
            <span>
              Signed in as <strong>{user.name}</strong>
            </span>
            {signOut}
          </div>
        </nav>
      </details>
      <div className="admin-user">
        <p>
          Signed in as <strong>{user.name}</strong>
          <span className="role">{user.role === "owner" ? "Owner" : "Editor"}</span>
        </p>
        {signOut}
      </div>
    </>
  );
}
