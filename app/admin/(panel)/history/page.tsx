import type { Metadata } from "next";
import { HistoryList, type HistoryRow } from "@/components/admin/HistoryList";
import { describeChanges, describePath } from "@/components/admin/screen-fields";
import { loadUsers, requireUser } from "@/lib/auth";
import { listHistory } from "@/lib/content";
import { isScreenKey, screens, toolTitles } from "@/lib/screens";

export const metadata: Metadata = { title: "Change history & undo" };

const when = (iso: string) =>
  new Date(iso).toLocaleString("en-US", { timeZone: "America/Los_Angeles", dateStyle: "medium", timeStyle: "short" });

const clip = (s: string, n = 140) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

/** A stored value in plain words, short enough for one line of the history. */
function show(v: unknown): string {
  if (v === undefined) return "(not kept)";
  if (v === null || v === "") return "(empty)";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (typeof v === "number") return String(v);
  if (typeof v === "string") return `“${clip(v)}”`;
  if (Array.isArray(v)) {
    if (!v.length) return "(none)";
    if (v.every((x) => typeof x === "string")) return clip(v.map((x) => `“${x}”`).join(", "));
    return `${v.length} item${v.length === 1 ? "" : "s"}`;
  }
  if (typeof v === "object") {
    const o = v as Record<string, unknown>;
    if (typeof o.src === "string") return o.src ? `Photo ${o.src.split("/").pop()}${o.alt ? ` (“${clip(String(o.alt), 60)}”)` : ""}` : "(no photo)";
    if (o.banner && typeof o.banner === "object") return "A saved banner";
    return "(several fields)";
  }
  return String(v);
}

export default async function HistoryPage() {
  await requireUser();
  const [history, users] = await Promise.all([listHistory(), loadUsers()]);
  const nameOf = (email: string, fallback: string) => users?.find((u) => u.email === email)?.name ?? fallback;
  const rows: HistoryRow[] = history.map((h) => ({
    id: h.id,
    when: when(h.savedAt),
    who: nameOf(h.savedBy.email, h.savedBy.name || h.savedBy.email),
    what: h.note ?? (isScreenKey(h.section) ? `Changed ${screens[h.section].title}` : (toolTitles[h.section] ?? "Saved the website")),
    details: h.changes?.length ? describeChanges(h.changes) : "",
    canUndo: Boolean(h.changes?.length),
    fields: h.fields.map((f) => {
      const d = describePath(f.path);
      return {
        path: f.path,
        label: d?.label ?? f.path.join(" › "),
        href: d?.href,
        before: show(f.before),
        after: show(f.after),
        canRevert: f.before !== undefined,
      };
    }),
  }));
  return (
    <>
      <header className="page-head">
        <h1>Change history &amp; undo</h1>
        <p className="lede-admin">
          The last 20 saves, newest first (California time). <strong>Undo this change</strong> puts back only what that one save changed.{" "}
          <strong>Go back to this version</strong> makes the whole website look exactly as it did right after that save. Open <strong>What changed</strong> to see
          each field before and after, and <strong>Revert this field</strong> to put back just that one. Each of these is saved as a new version, so it can be
          undone too.
        </p>
      </header>
      <HistoryList rows={rows} />
    </>
  );
}
