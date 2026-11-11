import { requireUser } from "@/lib/auth";
import { readContent } from "@/lib/content";
import { listMessages } from "@/lib/messages";
import { groupTitles, screenKeys, screens, type ScreenGroup } from "@/lib/screens";
import { storageMode } from "@/lib/storage";

// The jobs people come here for most, each one click from the start screen.
const tasks = [
  { href: "/admin/banner", title: "Change the promo banner", text: "Upload this month's banner, or bring back the last one." },
  { href: "/admin/banner#f-hero-mode", title: "Show the video instead", text: "Switch between the promo banner and the original video." },
  { href: "/admin/locations", title: "Change hours, phone or links", text: "Gate and office hours, phone numbers, payment and Rent Online links." },
  { href: "/admin/messages", title: "Read messages", text: "Everything sent with the contact form." },
  { href: "/admin/reviews", title: "Add a customer review", text: "Real reviews only, with permission." },
  { href: "/admin/history", title: "Undo a change", text: "See what was changed and when, and undo it." },
];

export default async function Start() {
  const user = await requireUser();
  const [content, messages] = await Promise.all([readContent(), listMessages(100).catch(() => [])]);
  const unread = messages.filter((m) => !m.read).length;
  const groups: ScreenGroup[] = ["top", "pages", "site"];
  const tools = [
    { href: "/admin/messages", title: unread ? `Messages (${unread} new)` : "Messages", text: "Messages sent with the contact form on the website." },
    { href: "/admin/history", title: "Change history & undo", text: "See what was changed and when, undo a save, or put back one field." },
    ...(user.role === "owner" ? [{ href: "/admin/users", title: "People who can sign in", text: "Give someone access, reset a password, or remove access." }] : []),
    { href: "/admin/account", title: "Your account", text: "Change your password." },
  ];

  return (
    <div className="start">
      <header className="page-head">
        <h1>Hello, {user.name}</h1>
        <p className="lede-admin">
          Everything on the Mid Valley Storage website can be changed here. Pick what you want to change, edit it, and press <strong>Save changes</strong>. The
          website updates within seconds, and any save can be undone.
        </p>
      </header>
      {storageMode() === "local" && <div className="notice warn">Test copy: changes are saved on this computer only, not on your live website.</div>}
      {content.hero.mode === "video" && (
        <div className="notice warn">
          The homepage is showing the original video, not the promo banner. <a href="/admin/banner">Change this on Promo banner</a>.
        </div>
      )}

      <section className="start-section" aria-labelledby="tasks-title">
        <h2 id="tasks-title">Common tasks</h2>
        <ul className="tasks">
          {tasks.map((t) => (
            <li key={t.href}>
              <a href={t.href}>
                <strong>{t.title}</strong>
                <span>{t.text}</span>
              </a>
            </li>
          ))}
        </ul>
      </section>

      {groups.map((g) => (
        <section key={g} className="start-section" aria-labelledby={`start-${g}`}>
          <h2 id={`start-${g}`}>{groupTitles[g]}</h2>
          <ul className="overview">
            {screenKeys
              .filter((k) => screens[k].group === g)
              .map((k) => (
                <li key={k}>
                  <a href={`/admin/${k}`}>
                    <strong>{screens[k].title}</strong>
                    <span>{screens[k].blurb}</span>
                  </a>
                </li>
              ))}
          </ul>
        </section>
      ))}

      <section className="start-section" aria-labelledby="tools-title">
        <h2 id="tools-title">Tools</h2>
        <ul className="overview">
          {tools.map((c) => (
            <li key={c.href}>
              <a href={c.href}>
                <strong>{c.title}</strong>
                <span>{c.text}</span>
              </a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
