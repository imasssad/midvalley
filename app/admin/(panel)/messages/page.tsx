import type { Metadata } from "next";
import { MessagesList, type MessageRow } from "@/components/admin/MessagesList";
import { requireUser } from "@/lib/auth";
import { phoneHref } from "@/lib/format";
import { listMessages } from "@/lib/messages";

export const metadata: Metadata = { title: "Messages" };

const when = (iso: string) =>
  new Date(iso).toLocaleString("en-US", { timeZone: "America/Los_Angeles", dateStyle: "medium", timeStyle: "short" });

export default async function MessagesPage() {
  await requireUser();
  const messages = await listMessages(200);
  const rows: MessageRow[] = messages.map((m) => ({
    id: m.id,
    when: when(m.receivedAt),
    name: m.name,
    phone: m.phone,
    phoneHref: m.phone ? phoneHref(m.phone) : "",
    email: m.email,
    location: m.location,
    message: m.message,
    emailed: m.emailed,
    read: m.read,
  }));
  const unread = rows.filter((r) => !r.read).length;
  return (
    <>
      <header className="page-head">
        <h1>Messages</h1>
        <p className="lede-admin">
          Everything sent with the contact form on the website, newest first (times are California time). New messages are highlighted until you mark them
          as read. {rows.length > 0 && (unread ? `${unread} unread.` : "All read.")}
        </p>
      </header>
      <MessagesList rows={rows} />
    </>
  );
}
