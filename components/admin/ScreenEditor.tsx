"use client";

// One admin screen: the fields for one part of the website on the left, a live preview of that part on the right.
// The draft is the whole site content (the preview needs it), but only this screen's parts are saved. Ported from
// rapidselfstorage: Save changes, Undo my changes, Undo this save, conflict detection when someone else saved the
// same part in the meantime, and a warning before leaving with unsaved changes.
import { useEffect, useMemo, useRef, useState } from "react";
import { restorePreviousBanner, saveScreen, type SaveResult } from "@/app/admin/actions";
import { fieldErrors, sectionSchemas, type SectionKey, type SiteContent } from "@/lib/content-schema";
import type { UploadMode } from "@/lib/media";
import { getAt, screens, setAt, type ScreenKey } from "@/lib/screens";
import { Fields } from "./fields";
import { PreviewFrame, type Device } from "./PreviewFrame";
import { previewParts } from "./preview-protocol";
import { screenBlocks } from "./screen-fields";

type Status =
  | { kind: "idle" }
  | { kind: "saving" }
  | { kind: "saved" }
  | { kind: "undone" }
  | { kind: "restored" }
  | { kind: "error"; message: string }
  | { kind: "conflict"; message: string };

const groupLabels = { top: "Most used", pages: "Pages", site: "On every page" } as const;

/** What the preview can't show for a screen (those parts live in server-only page files). */
const notPreviewed: Partial<Record<ScreenKey, string>> = {
  about: "The preview shows the page title and the closing band. The story, its photos and the timeline aren't drawn here: save, then use “See this on the website”.",
  features: "The preview shows the page title and the closing band. The feature sections aren't drawn here: save, then use “See this on the website”.",
  contact: "The preview shows the title, location cards and the form. The maps and the Instagram box aren't drawn here.",
  labels: "The preview shows where most of these words appear. The page-not-found page isn't drawn here.",
};

const when = (iso: string) =>
  new Date(iso).toLocaleString("en-US", { timeZone: "America/Los_Angeles", dateStyle: "medium", timeStyle: "short" });

/** Whether a part shows on the website right now, in words. Null when it shows normally. */
function visibilityNote(screen: ScreenKey, c: SiteContent): { ok: boolean; text: string } | null {
  if (screen === "banner") {
    return c.hero.mode === "video"
      ? { ok: false, text: "Original video is selected: visitors see the video, not the banner. Choose “Promo image” to show the banner." }
      : { ok: true, text: "Promo image is selected: the banner shows at the top of the homepage." };
  }
  if (screen === "reviews" && !c.testimonials.items.length) return { ok: false, text: "The reviews section is hidden until there is at least one review." };
  if (screen === "home" && !c.valueStrip.enabled) return { ok: false, text: "The value strip is switched off, so it isn't on the website." };
  if (screen === "locations") {
    const unconfirmed = c.locations.items.filter((l) => l.rentOnlineUrl && !l.rentOnlineConfirmed).map((l) => l.name);
    if (unconfirmed.length) return { ok: false, text: `Rent Online link not confirmed yet for: ${unconfirmed.join(", ")}. The buttons still show; tick the box once it's checked.` };
  }
  return null;
}

/** How Google might show each page (title and description), for the Search & sharing screen. */
function SearchPreview({ seo }: { seo: SiteContent["seo"] }) {
  const pages = [
    ["home", "midvalleystorage.com"],
    ["about", "midvalleystorage.com › about-us"],
    ["features", "midvalleystorage.com › facilityfeatures"],
    ["contact", "midvalleystorage.com › contact"],
  ] as const;
  return (
    <div>
      {pages.map(([key, url]) => (
        <div key={key} className="serp" aria-hidden="true">
          <span className="serp-url">{url}</span>
          <span className="serp-title">{seo[key].title.length > 60 ? `${seo[key].title.slice(0, 58)}…` : seo[key].title}</span>
          <span className="serp-text">{seo[key].description.length > 160 ? `${seo[key].description.slice(0, 158)}…` : seo[key].description}</span>
        </div>
      ))}
    </div>
  );
}

/** "Restore previous banner": shows the banner that was replaced and swaps it back (and saves) in one click. */
function BannerRestore({ saved, dirty, busy, onRestore }: { saved: SiteContent; dirty: boolean; busy: boolean; onRestore: () => void }) {
  const prev = saved.hero.previousBanner;
  if (!prev) {
    return (
      <div className="banner-restore">
        <p className="help">
          Each time you save a new banner, the one it replaces is kept here, so you can put it back with one click.
        </p>
      </div>
    );
  }
  return (
    <section className="banner-restore" aria-labelledby="restore-title">
      <h2 id="restore-title">Previous banner</h2>
      <div className="banner-restore-row">
        {/* eslint-disable-next-line @next/next/no-img-element -- admin thumbnail */}
        <img src={prev.banner.desktop.src} alt="" />
        <p className="help">
          {prev.replacedAt ? `Used until ${when(prev.replacedAt)}.` : "The banner used before the current one."} Restoring it saves right away and keeps the
          current banner here, so you can swap back.
        </p>
      </div>
      <p>
        <button type="button" className="btn-admin secondary" disabled={dirty || busy} onClick={onRestore} aria-describedby={dirty ? "restore-dirty" : undefined}>
          Restore previous banner
        </button>
      </p>
      {dirty && (
        <p className="help" id="restore-dirty">
          Save or undo your changes first.
        </p>
      )}
    </section>
  );
}

export function ScreenEditor({ screen, content, uploadMode }: { screen: ScreenKey; content: SiteContent; uploadMode: UploadMode }) {
  const def = screens[screen];
  const blocks = screenBlocks[screen];
  const parts = previewParts[screen] ?? [];
  const hasPreview = parts.length > 0 || screen === "seo";
  const [saved, setSaved] = useState(content);
  const [draft, setDraft] = useState(content);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [device, setDevice] = useState<Device>("computer");
  const [showPreview, setShowPreview] = useState(true);
  // What was stored just before the last save, for "Undo this save".
  const [before, setBefore] = useState<unknown[] | null>(null);
  const statusRef = useRef<HTMLParagraphElement>(null);
  const conflictRef = useRef<HTMLDivElement>(null);
  // Set when the person chose to drop their changes, so the browser doesn't ask "Leave site?" as well.
  const leaving = useRef(false);

  const valuesOf = (c: SiteContent) => def.scopes.map((p) => getAt(c, p));
  const scoped = (c: SiteContent) => JSON.stringify(valuesOf(c));
  const dirty = useMemo(() => scoped(draft) !== scoped(saved), [draft, saved]); // eslint-disable-line react-hooks/exhaustive-deps -- scopes are fixed per screen
  const note = visibilityNote(screen, draft);

  // Warn before leaving with unsaved changes (the admin menu uses normal links, so this covers it too).
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => {
      if (leaving.current) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  // Arriving from a link to a field (#f-…, for example from the history page): bring it into view and focus it.
  useEffect(() => {
    const id = decodeURIComponent(location.hash.slice(1));
    if (!id) return;
    const t = setTimeout(() => {
      const el = document.getElementById(id);
      if (!el) return;
      el.scrollIntoView({ block: "center" });
      el.classList.add("is-target");
      const control = el.matches("input, textarea, select")
        ? el
        : el.querySelector<HTMLElement>("input:not([type=file]):not([type=checkbox]), textarea, select, button");
      control?.focus({ preventScroll: true });
    }, 60);
    return () => clearTimeout(t);
  }, []);

  // A conflict is reported above the form: bring it into view and put focus on its main choice.
  useEffect(() => {
    if (status.kind !== "conflict") return;
    conflictRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
    conflictRef.current?.querySelector<HTMLButtonElement>("button.primary")?.focus({ preventScroll: true });
  }, [status.kind]);

  // Phones get the phone-sized preview by default.
  useEffect(() => {
    if (window.matchMedia("(max-width: 700px)").matches) setDevice("phone");
  }, []);

  function onChange(path: (string | number)[], v: unknown) {
    setDraft((prev) => setAt(prev, path, v));
    if (status.kind !== "saving") setStatus({ kind: "idle" });
  }

  function showErrors(errs: Record<string, string>, message: string) {
    setErrors(errs);
    setStatus({ kind: "error", message });
    requestAnimationFrame(() =>
      document.querySelector<HTMLElement>(".editor-form [aria-invalid='true'], .editor-form .field-error")?.scrollIntoView({ block: "center", behavior: "smooth" }),
    );
  }

  /** Puts what the server stored into the editor: this screen's values plus anything it changed alongside. */
  function applyStored(base: SiteContent, res: Extract<SaveResult, { ok: true }>): SiteContent {
    const withValues = def.scopes.reduce((c, p, i) => setAt(c, p, res.values[i]), base);
    return res.also.reduce((c, a) => setAt(c, a.path, a.value), withValues);
  }

  async function save(force = false) {
    if (status.kind === "saving") return;
    // Check the parts of the website this screen changes, with the same rules the server uses.
    let clean = draft;
    const errs: Record<string, string> = {};
    for (const key of new Set(def.scopes.map((p) => p[0] as SectionKey))) {
      const parsed = sectionSchemas[key].safeParse(draft[key]);
      if (parsed.success) clean = { ...clean, [key]: parsed.data };
      else for (const [k, v] of Object.entries(fieldErrors(parsed.error))) errs[k ? `${key}.${k}` : key] = v;
    }
    if (Object.keys(errs).length) return showErrors(errs, "Not saved yet: some fields need attention. They're marked in red.");

    setStatus({ kind: "saving" });
    const res = await saveScreen(screen, valuesOf(clean), valuesOf(saved), force).catch(() => null);
    if (!res) return setStatus({ kind: "error", message: "The connection dropped and nothing was saved. Check your internet and try again." });
    if (!res.ok) {
      if (res.conflict) return setStatus({ kind: "conflict", message: res.error });
      return showErrors(res.fieldErrors ?? {}, res.error);
    }
    const stored = applyStored(clean, res);
    setBefore(res.previous);
    setErrors({});
    setSaved(stored);
    setDraft(stored);
    setStatus({ kind: "saved" });
  }

  async function undoSave() {
    if (!before || status.kind === "saving") return;
    setStatus({ kind: "saving" });
    const res = await saveScreen(screen, before, valuesOf(saved)).catch(() => null);
    if (!res) return setStatus({ kind: "error", message: "The connection dropped and nothing was changed. Try again." });
    if (!res.ok) return setStatus({ kind: "error", message: res.conflict ? `Can't undo: ${res.error}` : res.error });
    const restored = applyStored(saved, res);
    setBefore(null);
    setSaved(restored);
    setDraft(restored);
    setStatus({ kind: "undone" });
    statusRef.current?.focus();
  }

  async function restoreBanner() {
    if (status.kind === "saving") return;
    setStatus({ kind: "saving" });
    const res = await restorePreviousBanner({ banner: saved.hero.banner, disclaimer: saved.hero.disclaimer }).catch(() => null);
    if (!res) return setStatus({ kind: "error", message: "The connection dropped and nothing was changed. Try again." });
    // A conflict here means someone changed the banner since this page was opened: show their version first.
    if (!res.ok) return setStatus({ kind: "error", message: res.conflict ? `${res.error} Reload the page to see the current banner.` : res.error });
    const restored = applyStored(saved, res);
    setBefore(res.previous);
    setErrors({});
    setSaved(restored);
    setDraft(restored);
    setStatus({ kind: "restored" });
    statusRef.current?.focus();
  }

  function onSave(e: React.FormEvent) {
    e.preventDefault();
    void save();
  }

  const ctx = { errors, onChange, uploadMode, savedAt: (path: (string | number)[]) => getAt(saved, path) };
  const savedOk = (status.kind === "saved" || status.kind === "restored") && !dirty;

  return (
    <form className={hasPreview ? "editor screen-editor" : "editor"} onSubmit={onSave} noValidate>
      <header className="page-head">
        <p className="crumbs">
          <a href="/admin">Start</a> <span aria-hidden="true">›</span> {groupLabels[def.group]}
        </p>
        <h1>{def.title}</h1>
        <p className="lede-admin">{def.blurb}</p>
        {def.note && (
          <p className="good-to-know">
            <strong>Good to know:</strong> {def.note}
          </p>
        )}
        {def.page && (
          <p>
            <a className="see-live" href={def.page} target="_blank" rel="noopener">
              See this on the website ↗<span className="sr-only-admin"> (opens in a new tab)</span>
            </a>
          </p>
        )}
      </header>

      <div className={hasPreview ? "editor-cols" : undefined}>
        <div className="editor-form">
          {status.kind === "error" && (
            <div className="notice error" role="alert">
              {status.message}
            </div>
          )}
          {status.kind === "conflict" && (
            <div ref={conflictRef} className="notice error" role="alert">
              <p>{status.message}</p>
              <p className="notice-actions">
                <button
                  type="button"
                  className="btn-admin secondary"
                  onClick={() => {
                    leaving.current = true;
                    location.reload();
                  }}
                >
                  Show their version (drops my changes)
                </button>
                <button type="button" className="btn-admin primary" onClick={() => void save(true)}>
                  Save mine anyway
                </button>
              </p>
            </div>
          )}
          {screen === "banner" &&
            draft.hero.banner.desktop.src !== saved.hero.banner.desktop.src &&
            draft.hero.banner.alt === saved.hero.banner.alt && (
              <p className="notice warn" role="status">
                You picked a new banner: update “Describe the banner” below so it matches the new picture and its words
                (people using screen readers, and Google, read that description instead of the picture).
              </p>
            )}
          {screen === "banner" && <BannerRestore saved={saved} dirty={dirty} busy={status.kind === "saving"} onRestore={() => void restoreBanner()} />}
          {blocks.map((block, i) => {
            const value = getAt(draft, block.path) as Record<string, unknown>;
            if (!block.title) return <Fields key={i} top fields={block.fields} value={value} path={block.path} ctx={ctx} />;
            const id = `block-${screen}-${i}`;
            return (
              <section key={i} className="group" aria-labelledby={id}>
                <h2 id={id}>{block.title}</h2>
                {block.help && <p className="help">{block.help}</p>}
                <Fields fields={block.fields} value={value} path={block.path} ctx={ctx} />
              </section>
            );
          })}
        </div>

        {hasPreview && (
          <aside className="editor-preview" aria-label="Preview">
            <div className="preview-head">
              <div>
                <h2>{screen === "seo" ? "How it may look in Google" : "Preview"}</h2>
                <p className="help">Updates as you type. Visitors see it only after you save.</p>
              </div>
              {parts.length > 0 && (
                <div className="preview-tools">
                  <div className="segmented" role="group" aria-label="Preview size">
                    {(["computer", "tablet", "phone"] as const).map((d) => (
                      <button key={d} type="button" aria-pressed={device === d} onClick={() => setDevice(d)}>
                        {d === "computer" ? "Computer" : d === "tablet" ? "Tablet" : "Phone"}
                      </button>
                    ))}
                  </div>
                  <button type="button" className="link-btn" aria-expanded={showPreview} onClick={() => setShowPreview((s) => !s)}>
                    {showPreview ? "Hide" : "Show"}
                  </button>
                </div>
              )}
            </div>
            {note && <p className={note.ok ? "preview-status ok" : "preview-status"}>{note.text}</p>}
            {notPreviewed[screen] && <p className="help">{notPreviewed[screen]}</p>}
            {screen === "seo" ? (
              <SearchPreview seo={draft.seo} />
            ) : (
              showPreview && <PreviewFrame target={screen} content={draft} device={device} title={`Preview of ${def.title}`} />
            )}
          </aside>
        )}
      </div>

      <div className="save-bar">
        <button type="submit" className="btn-admin primary" aria-disabled={!dirty || status.kind === "saving"} disabled={!dirty}>
          {status.kind === "saving" ? "Saving…" : "Save changes"}
        </button>
        {dirty && status.kind !== "saving" && (
          <button
            type="button"
            className="btn-admin secondary"
            onClick={() => {
              setDraft(saved);
              setErrors({});
              setStatus({ kind: "idle" });
              statusRef.current?.focus();
            }}
          >
            Undo my changes
          </button>
        )}
        {/* Focus lands here after an undo removes the button that was pressed. */}
        <p ref={statusRef} className="save-status" role="status" aria-live="polite" tabIndex={-1}>
          {savedOk ? (
            <>
              <span className="ok">{status.kind === "restored" ? "The previous banner is back on the website." : "Saved. Your website is updated."}</span>{" "}
              {def.page && (
                <a href={def.page} target="_blank" rel="noopener">
                  View it on the website ↗
                </a>
              )}
              {before && (
                <>
                  {" · "}
                  <button type="button" className="link-btn" onClick={() => void undoSave()}>
                    Undo this save
                  </button>
                </>
              )}
            </>
          ) : status.kind === "undone" && !dirty ? (
            <span className="ok">Undone. This part of the website is back to how it was.</span>
          ) : status.kind === "error" || status.kind === "conflict" ? (
            <span className="bad">Not saved. See the message above.</span>
          ) : dirty ? (
            "You have unsaved changes."
          ) : (
            "No changes yet."
          )}
        </p>
      </div>
    </form>
  );
}
