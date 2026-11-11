"use client";

// Contact form messages with a "Mark as read" / "Mark as unread" switch on each. The page is rendered on the
// server; this only keeps each message's read state in step after the click (and the menu's count on refresh).
import { useRouter } from "next/navigation";
import { useState } from "react";
import { setMessageRead } from "@/app/admin/actions";

export type MessageRow = {
  id: string;
  when: string;
  name: string;
  phone: string;
  phoneHref: string;
  email: string;
  location: string;
  message: string;
  emailed: boolean;
  read: boolean;
};

export function MessagesList({ rows }: { rows: MessageRow[] }) {
  const router = useRouter();
  const [read, setRead] = useState<Record<string, boolean>>(() => Object.fromEntries(rows.map((r) => [r.id, r.read])));
  const [busy, setBusy] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);

  async function toggle(id: string) {
    const next = !read[id];
    setBusy(id);
    setProblem(null);
    const res = await setMessageRead(id, next);
    setBusy(null);
    if (!res.ok) return setProblem(res.error);
    setRead((r) => ({ ...r, [id]: next }));
    router.refresh();
  }

  if (!rows.length) return <p className="empty">No messages yet. When someone uses the contact form on the website, their message appears here.</p>;
  return (
    <>
      {problem && (
        <div className="notice error" role="alert">
          {problem}
        </div>
      )}
      <ol className="messages">
        {rows.map((m) => {
          const isRead = read[m.id];
          const titleId = `msg-${m.id}`;
          return (
            <li key={m.id} className={isRead ? "message" : "message is-unread"}>
              <div className="message-top">
                <h2 id={titleId}>
                  {m.name || "No name given"}
                  {!isRead && <span className="message-new">New</span>}
                </h2>
                <button type="button" className="mini-btn" disabled={busy === m.id} onClick={() => void toggle(m.id)}>
                  {busy === m.id ? "Saving…" : isRead ? "Mark as unread" : "Mark as read"}
                  <span className="sr-only-admin">: message from {m.name || "no name"}</span>
                </button>
              </div>
              <dl className="message-facts">
                <div>
                  <dt>Received</dt>
                  <dd>{m.when}</dd>
                </div>
                {m.location && (
                  <div>
                    <dt>Location</dt>
                    <dd>{m.location}</dd>
                  </div>
                )}
                {m.phone && (
                  <div>
                    <dt>Phone</dt>
                    <dd>
                      <a href={m.phoneHref}>{m.phone}</a>
                    </dd>
                  </div>
                )}
                {m.email && (
                  <div>
                    <dt>Email</dt>
                    <dd>
                      <a href={`mailto:${encodeURIComponent(m.email).replace(/%40/g, "@")}`}>{m.email}</a>
                    </dd>
                  </div>
                )}
                <div>
                  <dt>Emailed to you</dt>
                  <dd className={m.emailed ? undefined : "message-email-no"}>{m.emailed ? "Yes" : "No (read it here)"}</dd>
                </div>
              </dl>
              {m.message ? <p className="message-body">{m.message}</p> : <p className="help">No message text.</p>}
            </li>
          );
        })}
      </ol>
    </>
  );
}
