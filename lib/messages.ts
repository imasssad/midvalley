// Contact form submissions, kept in storage (Vercel Blob, or .data/ locally) so the owner can read them in the
// admin panel (Messages). One JSON file per message under messages/. Personal data is stored only here (private
// Blob store), never written to server logs.
import "server-only";
import { listFiles, readJSON, writeJSON } from "./storage";

export type ContactMessage = {
  id: string;
  receivedAt: string;
  name: string;
  phone: string;
  email: string;
  location: string;
  message: string;
  read: boolean;
  /** Whether the email to CONTACT_TO_EMAIL went out. */
  emailed: boolean;
};

const PREFIX = "messages/";
const ID = /^[0-9TZ-]{20,30}-[a-z0-9]{6}$/;
const pathFor = (id: string) => `${PREFIX}${id}.json`;

export async function saveMessage(input: Omit<ContactMessage, "id" | "receivedAt" | "read" | "emailed">): Promise<ContactMessage> {
  const receivedAt = new Date().toISOString();
  const rand = Array.from(crypto.getRandomValues(new Uint8Array(4)), (b) => (b % 36).toString(36)).join("").padEnd(6, "0").slice(0, 6);
  const id = `${receivedAt.replace(/[:.]/g, "-")}-${rand}`;
  const msg: ContactMessage = { ...input, id, receivedAt, read: false, emailed: false };
  await writeJSON(pathFor(id), msg);
  return msg;
}

export async function updateMessage(id: string, patch: Partial<Pick<ContactMessage, "read" | "emailed">>): Promise<boolean> {
  if (!ID.test(id)) return false;
  const msg = await readJSON<ContactMessage>(pathFor(id));
  if (!msg) return false;
  await writeJSON(pathFor(id), { ...msg, ...patch });
  return true;
}

/** Newest first. */
export async function listMessages(limit = 200): Promise<ContactMessage[]> {
  const files = (await listFiles(PREFIX)).filter((f) => f.pathname.endsWith(".json")).sort((a, b) => b.pathname.localeCompare(a.pathname));
  const msgs = await Promise.all(files.slice(0, limit).map((f) => readJSON<ContactMessage>(f.pathname).catch(() => null)));
  return msgs.filter((m): m is ContactMessage => m !== null);
}
