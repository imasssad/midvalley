"use client";

// The history page's list of saves: who, what and when, with "Undo this change", "Go back to this version", and
// per field "Revert this field" (each asks first, in the page itself).
import { useRouter } from "next/navigation";
import { useState } from "react";
import { restoreVersion, revertField, undoChange, type ActionResult } from "@/app/admin/actions";

type Path = (string | number)[];
export type HistoryField = { path: Path; label: string; href?: string; before: string; after: string; canRevert: boolean };
export type HistoryRow = {
  id: string;
  when: string;
  who: string;
  what: string;
  details: string;
  canUndo: boolean;
  fields: HistoryField[];
};
type Asking = { id: string; kind: "undo" | "restore" } | { id: string; kind: "field"; field: number } | null;

export function HistoryList({ rows }: { rows: HistoryRow[] }) {
  const router = useRouter();
  const [asking, setAsking] = useState<Asking>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);

  async function run(key: string, fn: () => Promise<ActionResult>) {
    setBusy(key);
    setAsking(null);
    const res = await fn().catch(() => ({ ok: false as const, error: "The connection dropped and nothing was changed. Try again." }));
    setBusy(null);
    setNotice(res.ok ? { ok: true, text: res.message ?? "Done. Your website is updated." } : { ok: false, text: res.error });
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (res.ok) router.refresh();
  }

  if (!rows.length) return <p className="empty">No saved versions yet. Each time you save, a version appears here.</p>;
  return (
    <>
      {notice && (
        <div className={notice.ok ? "notice ok" : "notice error"} role="status">
          {notice.text}{" "}
          {notice.ok && (
            <a href="/" target="_blank" rel="noopener">
              View website ↗
            </a>
          )}
        </div>
      )}
      <ol className="history">
        {rows.map((r, i) => (
          <li key={r.id}>
            <div className="history-top">
              <div>
                <strong>
                  {r.what}
                  {i === 0 && <span className="current">Current version</span>}
                </strong>
                {r.details && <span className="history-meta">{r.details}</span>}
                <span className="history-meta">
                  {r.who} · {r.when}
                </span>
              </div>
              {asking && asking.id === r.id && asking.kind !== "field" ? (
                <span className="confirm" role="group" aria-labelledby={`ask-${r.id}`}>
                  <span id={`ask-${r.id}`}>
                    {asking.kind === "undo"
                      ? "Put back what these fields said before this save? Nothing else changes."
                      : "Make the whole website look exactly as it did right after this save? Every change saved after it is undone too."}
                  </span>
                  <button
                    type="button"
                    className="mini-btn solid"
                    onClick={() => run(r.id, () => (asking.kind === "undo" ? undoChange(r.id) : restoreVersion(r.id)))}
                  >
                    {asking.kind === "undo" ? "Yes, undo it" : "Yes, go back"}
                  </button>
                  <button type="button" className="mini-btn" onClick={() => setAsking(null)} autoFocus>
                    Cancel
                  </button>
                </span>
              ) : (
                <span className="history-tools">
                  {r.canUndo && (
                    <button type="button" className="btn-admin secondary" disabled={busy !== null} onClick={() => setAsking({ id: r.id, kind: "undo" })}>
                      {busy === r.id ? "Working…" : "Undo this change"}
                    </button>
                  )}
                  {i > 0 && (
                    <button type="button" className="link-btn" disabled={busy !== null} onClick={() => setAsking({ id: r.id, kind: "restore" })}>
                      Go back to this version
                    </button>
                  )}
                </span>
              )}
            </div>
            {r.fields.length > 0 && (
              <details className="history-fields">
                <summary>
                  What changed ({r.fields.length} field{r.fields.length === 1 ? "" : "s"})
                </summary>
                <ul>
                  {r.fields.map((f, j) => {
                    const key = `${r.id}:${j}`;
                    const isAsking = asking?.kind === "field" && asking.id === r.id && asking.field === j;
                    return (
                      <li key={key}>
                        <div>
                          <span className="history-field-name">{f.href ? <a href={f.href}>{f.label}</a> : f.label}</span>
                          <span className="history-change">
                            <span className="sr-only-admin">Before: </span>
                            <del>{f.before}</del>
                            <span aria-hidden="true">→</span>
                            <span className="sr-only-admin">After: </span>
                            <ins>{f.after}</ins>
                          </span>
                        </div>
                        {f.canRevert &&
                          (isAsking ? (
                            <span className="confirm" role="group" aria-label={`Revert ${f.label}?`}>
                              <span>Put back the value from before this save?</span>
                              <button type="button" className="mini-btn solid" onClick={() => run(key, () => revertField(r.id, f.path, f.label))}>
                                Yes, revert
                              </button>
                              <button type="button" className="mini-btn" onClick={() => setAsking(null)} autoFocus>
                                Cancel
                              </button>
                            </span>
                          ) : (
                            <button
                              type="button"
                              className="mini-btn"
                              disabled={busy !== null}
                              onClick={() => setAsking({ id: r.id, kind: "field", field: j })}
                            >
                              {busy === key ? "Working…" : "Revert this field"}
                              <span className="sr-only-admin">: {f.label}</span>
                            </button>
                          ))}
                      </li>
                    );
                  })}
                </ul>
              </details>
            )}
          </li>
        ))}
      </ol>
    </>
  );
}
