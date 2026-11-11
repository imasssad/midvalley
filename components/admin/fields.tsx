"use client";

// Renders a screen's fields (see screen-fields.ts) as a plain, labelled form. Field ids are the full content path
// (f-home-about-heading), so history links can point straight at a field. Link fields check themselves as you
// type and show a live "Open link ↗" so the owner can try the address; phone fields check for a 10-digit number.
import { useEffect, useState } from "react";
import { LINK_PATTERN, linkProblem, type Photo } from "@/lib/content-schema";
import type { UploadMode } from "@/lib/media";
import { phoneDigits } from "@/lib/phone";
import { PhotoField } from "./PhotoField";
import type { Field } from "./screen-fields";

type Path = (string | number)[];
export type FieldCtx = {
  errors: Record<string, string>;
  onChange: (path: Path, value: unknown) => void;
  uploadMode: UploadMode;
  /** The value at a path as last saved, to tell new from saved (for example a just-uploaded photo). */
  savedAt?: (path: Path) => unknown;
};

const idFor = (path: Path) => `f-${path.join("-")}`;
const keyOf = (path: Path) => path.join(".");

function Help({ id, text }: { id: string; text?: string }) {
  return text ? (
    <p className="help" id={id}>
      {text}
    </p>
  ) : null;
}

function ErrorText({ id, text }: { id: string; text?: string | null }) {
  return text ? (
    <p className="field-error" id={id} role="alert">
      {text}
    </p>
  ) : null;
}

function describedBy(id: string, help?: string, error?: string | null) {
  return [help && `${id}-help`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;
}

const SHORT = new Set<Field["kind"]>(["select", "check"]);
const isBlock = (f: Field) => ["group", "list", "strings", "photo", "photos", "radio"].includes(f.kind);

/** Browsers without CSS field-sizing: size the growing box to its text (called after every render). */
function growFallback(el: HTMLTextAreaElement | null) {
  if (!el || CSS.supports("field-sizing", "content")) return;
  el.style.height = "auto";
  el.style.height = `${el.scrollHeight + 2}px`;
}

/** "midvalleystorage.com/x" → "https://midvalleystorage.com/x", so an address pasted without https:// still works. */
function withScheme(v: string): string {
  const t = v.trim();
  return /^[a-z0-9-]+(\.[a-z0-9-]+)+(\/\S*)?$/i.test(t) ? `https://${t}` : v;
}

/** What's wrong with a link or phone number as typed, checked in the browser (the server checks again on save). */
function liveProblem(kind: Field & { kind: "text" }, value: string): string | null {
  const v = value.trim();
  if (!v) return null;
  if (kind.inputType === "url") return linkProblem(v);
  if (kind.inputType === "href" && !(LINK_PATTERN.test(v) || /^\/[^\s<>"'`]*$/.test(v))) return "Use a page like /contact or a full link that starts with https://";
  if (kind.inputType === "tel" && phoneDigits(v) === null) return "Enter a 10-digit US phone number, like (559) 734-7368.";
  return null;
}

/**
 * Renders fields on a two-column grid (short inputs share a row). At the top level of a screen, runs of plain
 * fields are wrapped in a card so they match the grouped sections.
 */
export function Fields({ fields, value, path, ctx, top = false }: { fields: Field[]; value: Record<string, unknown>; path: Path; ctx: FieldCtx; top?: boolean }) {
  const render = (f: Field, i: number) => {
    if (f.kind === "group") {
      const groupPath = f.key ? [...path, f.key] : path;
      const groupValue = ((f.key ? value?.[f.key] : value) ?? {}) as Record<string, unknown>;
      return (
        <fieldset key={f.key ?? `g${i}`} className="group cell wide" id={f.key ? idFor(groupPath) : undefined}>
          <legend>{f.label}</legend>
          {f.help && <p className="help">{f.help}</p>}
          <Fields fields={f.fields} value={groupValue} path={groupPath} ctx={ctx} />
        </fieldset>
      );
    }
    return (
      <div key={f.key} className={SHORT.has(f.kind) ? "cell" : "cell wide"}>
        <FieldView field={f} value={value?.[f.key]} path={[...path, f.key]} ctx={ctx} />
      </div>
    );
  };

  if (!top) return <div className="field-grid">{fields.map(render)}</div>;

  const chunks: Field[][] = [];
  for (const f of fields) {
    const last = chunks[chunks.length - 1];
    if (!isBlock(f) && last && !isBlock(last[0])) last.push(f);
    else chunks.push([f]);
  }
  return (
    <>
      {chunks.map((chunk, i) =>
        isBlock(chunk[0]) ? (
          <div key={`b${i}`} className="field-grid">
            {render(chunk[0], i)}
          </div>
        ) : (
          <div key={`run${i}`} className="group">
            <div className="field-grid">{chunk.map(render)}</div>
          </div>
        ),
      )}
    </>
  );
}

function TextField({ field: f, value, path, ctx }: { field: Field & { kind: "text" }; value: string; path: Path; ctx: FieldCtx }) {
  const id = idFor(path);
  const [touched, setTouched] = useState(false);
  const live = touched ? liveProblem(f, value) : null;
  const error = ctx.errors[keyOf(path)] ?? live;
  const set = (v: unknown) => ctx.onChange(path, v);
  const aria = { "aria-invalid": error ? true : undefined, "aria-describedby": describedBy(id, f.help, error) };
  const isLink = f.inputType === "url" || f.inputType === "href";
  const linkOk = isLink && value.trim() !== "" && liveProblem(f, value) === null;
  const near = f.max <= 400 && value.length > f.max * 0.85;

  let control: React.ReactNode;
  if (f.multiline) {
    control = <textarea id={id} value={value} maxLength={f.max} rows={3} onChange={(e) => set(e.target.value)} {...aria} />;
  } else if (f.max >= 60 && !f.inputType) {
    // A sentence-long line: a box that grows to show all of it (phones cut a one-line box off), where Enter doesn't add a line break.
    control = (
      <textarea
        id={id}
        className="grow"
        ref={(el) => growFallback(el)}
        value={value}
        maxLength={f.max}
        rows={1}
        onChange={(e) => set(e.target.value.replace(/\s*\n\s*/g, " "))}
        onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
        {...aria}
      />
    );
  } else {
    control = (
      <input
        id={id}
        type={f.inputType === "href" ? "text" : (f.inputType ?? "text")}
        inputMode={f.inputType === "href" ? "url" : undefined}
        autoComplete="off"
        spellCheck={isLink ? false : undefined}
        value={value}
        maxLength={f.max}
        placeholder={f.placeholder}
        onChange={(e) => set(e.target.value)}
        onBlur={(e) => {
          setTouched(true);
          if (isLink && e.target.value !== withScheme(e.target.value)) set(withScheme(e.target.value));
        }}
        {...aria}
      />
    );
  }

  return (
    <div className="field">
      <label htmlFor={id}>{f.label}</label>
      <Help id={`${id}-help`} text={f.help} />
      {isLink ? (
        <div className="input-row">
          {control}
          {linkOk ? (
            <a className="open-link" href={value.trim()} target="_blank" rel="noopener noreferrer">
              Open link ↗<span className="sr-only-admin"> (checks “{f.label}” in a new tab)</span>
            </a>
          ) : (
            <span className="open-link" aria-disabled="true">
              Open link ↗
            </span>
          )}
        </div>
      ) : (
        control
      )}
      {near && (
        <p className={value.length >= f.max ? "count is-near" : "count"} aria-live="polite">
          {value.length} / {f.max}
        </p>
      )}
      <ErrorText id={`${id}-error`} text={error} />
    </div>
  );
}

function FieldView({ field: f, value, path, ctx }: { field: Exclude<Field, { kind: "group" }>; value: unknown; path: Path; ctx: FieldCtx }) {
  const id = idFor(path);
  const error = ctx.errors[keyOf(path)];
  const set = (v: unknown) => ctx.onChange(path, v);
  const aria = { "aria-invalid": error ? true : undefined, "aria-describedby": describedBy(id, "help" in f ? f.help : undefined, error) };

  switch (f.kind) {
    case "text":
      return <TextField field={f} value={String(value ?? "")} path={path} ctx={ctx} />;
    case "toggle":
      return (
        <div className="field">
          <label className="toggle" htmlFor={id}>
            <input id={id} type="checkbox" role="switch" checked={Boolean(value)} onChange={(e) => set(e.target.checked)} {...aria} />
            <span className="toggle-track" aria-hidden="true" />
            <span>{f.label}</span>
          </label>
          <Help id={`${id}-help`} text={f.help} />
          <ErrorText id={`${id}-error`} text={error} />
        </div>
      );
    case "check":
      return (
        <div className="field">
          <label className="check" htmlFor={id}>
            <input id={id} type="checkbox" checked={Boolean(value)} onChange={(e) => set(e.target.checked)} {...aria} />
            <span>{f.label}</span>
          </label>
          <Help id={`${id}-help`} text={f.help} />
          <ErrorText id={`${id}-error`} text={error} />
        </div>
      );
    case "select":
      return (
        <div className="field">
          <label htmlFor={id}>{f.label}</label>
          <Help id={`${id}-help`} text={f.help} />
          <select id={id} value={String(value ?? "")} onChange={(e) => set(e.target.value)} {...aria}>
            {f.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <ErrorText id={`${id}-error`} text={error} />
        </div>
      );
    case "radio":
      return (
        <fieldset className="choices" id={id} aria-describedby={describedBy(id, f.help, error)}>
          <legend>{f.label}</legend>
          <Help id={`${id}-help`} text={f.help} />
          {f.options.map((o) => (
            <label key={o.value} className="choice-card">
              <input type="radio" name={id} value={o.value} checked={value === o.value} onChange={() => set(o.value)} />
              <span>
                <strong>{o.label}</strong>
                {o.help && <span>{o.help}</span>}
              </span>
            </label>
          ))}
          <ErrorText id={`${id}-error`} text={error} />
        </fieldset>
      );
    case "photo":
      return (
        <PhotoField
          id={id}
          label={f.label}
          help={f.help}
          value={value as Photo | undefined}
          onChange={set}
          errors={{ src: ctx.errors[`${keyOf(path)}.src`] ?? error, alt: ctx.errors[`${keyOf(path)}.alt`] }}
          uploadMode={ctx.uploadMode}
          savedSrc={(ctx.savedAt?.(path) as { src?: string } | undefined)?.src}
          variant={f.variant}
          optional={f.optional}
        />
      );
    case "photos":
      return <PhotosField field={f} value={(value as Photo[]) ?? []} path={path} ctx={ctx} />;
    case "list":
      return <ListField field={f} value={(value as Record<string, unknown>[]) ?? []} path={path} ctx={ctx} />;
    case "strings":
      return <StringsField field={f} value={(value as string[]) ?? []} path={path} ctx={ctx} />;
  }
}

// ---- Lists ----

function move<T>(arr: T[], from: number, to: number): T[] {
  const copy = [...arr];
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
}

/** Remove button that asks for confirmation in the page itself. */
function RemoveButton({ what, onConfirm }: { what: string; onConfirm: () => void }) {
  const [asking, setAsking] = useState(false);
  if (!asking) {
    return (
      <button type="button" className="mini-btn danger" onClick={() => setAsking(true)}>
        Remove<span className="sr-only-admin"> this {what}</span>
      </button>
    );
  }
  return (
    <span className="confirm" role="group" aria-label={`Remove this ${what}?`}>
      <span>Remove this {what}?</span>
      <button
        type="button"
        className="mini-btn danger solid"
        onClick={() => {
          setAsking(false);
          onConfirm();
        }}
      >
        Yes, remove
      </button>
      <button type="button" className="mini-btn" onClick={() => setAsking(false)} autoFocus>
        Cancel
      </button>
    </span>
  );
}

function ItemTools({ index, count, what, onMove, onRemove }: { index: number; count: number; what: string; onMove: (to: number) => void; onRemove: () => void }) {
  return (
    <div className="item-tools">
      <button type="button" className="mini-btn" disabled={index === 0} onClick={() => onMove(index - 1)} aria-label={`Move ${what} ${index + 1} up`}>
        ↑ Up
      </button>
      <button type="button" className="mini-btn" disabled={index === count - 1} onClick={() => onMove(index + 1)} aria-label={`Move ${what} ${index + 1} down`}>
        ↓ Down
      </button>
      <RemoveButton what={what} onConfirm={onRemove} />
    </div>
  );
}

let lastKey = 0;
const itemKey = (item: unknown) => (item && typeof item === "object" && typeof (item as { id?: unknown }).id === "string" ? (item as { id: string }).id : `k${++lastKey}`);

/**
 * Stable React keys for a list's items while they're moved, added or removed, so focus and open/closed state stay
 * with the item. When the list changes from outside (Undo my changes, a save), the keys start again.
 */
function useItemKeys(value: unknown[]) {
  const [keys, setKeys] = useState<string[]>(() => value.map(itemKey));
  let current = keys;
  if (keys.length !== value.length) {
    current = value.map(itemKey);
    setKeys(current);
  }
  return [current, setKeys] as const;
}

function ListField({ field: f, value, path, ctx }: { field: Extract<Field, { kind: "list" }>; value: Record<string, unknown>[]; path: Path; ctx: FieldCtx }) {
  const error = ctx.errors[keyOf(path)];
  const full = f.max !== undefined && value.length >= f.max;
  const [current, setKeys] = useItemKeys(value);
  // Long lists start folded, so the page shows every item's name at a glance. New items and items with a problem
  // open by themselves.
  const [opened, setOpened] = useState<Set<string>>(() => new Set());
  const isOpen = (i: number) => !f.collapse || opened.has(current[i]) || Object.keys(ctx.errors).some((k) => k.startsWith(`${keyOf([...path, i])}.`));
  // A link to a field inside a folded item (from the history page) opens that item.
  useEffect(() => {
    if (!f.collapse) return;
    const prefix = `${idFor(path)}-`;
    const hash = decodeURIComponent(location.hash.slice(1));
    if (!hash.startsWith(prefix)) return;
    const i = Number(hash.slice(prefix.length).split("-")[0]);
    if (Number.isInteger(i) && value[i]) setOpened((prev) => new Set(prev).add(current[i]));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- only on arrival

  const toggle = (k: string) =>
    setOpened((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });

  return (
    <div className="list" id={idFor(path)}>
      <div className="list-head">
        <h3>{f.label}</h3>
        {f.help && <p className="help">{f.help}</p>}
        <ErrorText id={`${idFor(path)}-error`} text={error} />
      </div>
      {value.length === 0 && <p className="help">None yet.</p>}
      <ol className="list-items">
        {value.map((item, i) => {
          const k = current[i];
          const open = isOpen(i);
          const bodyId = `${idFor([...path, i])}--panel`;
          return (
            <li key={k} className={open ? "list-item" : "list-item is-folded"}>
              <div className="list-item-head">
                {f.collapse ? (
                  <button type="button" className="item-toggle" aria-expanded={open} aria-controls={bodyId} onClick={() => toggle(k)}>
                    <span className="chev" aria-hidden="true" />
                    <strong>{f.itemTitle(item, i)}</strong>
                    <span className="item-toggle-hint">{open ? "Close" : "Edit"}</span>
                  </button>
                ) : (
                  <strong>{f.itemTitle(item, i)}</strong>
                )}
                {!f.fixed && (
                  <ItemTools
                    index={i}
                    count={value.length}
                    what={f.itemName}
                    onMove={(to) => {
                      setKeys(move(current, i, to));
                      ctx.onChange(path, move(value, i, to));
                    }}
                    onRemove={() => {
                      setKeys(current.filter((_, j) => j !== i));
                      ctx.onChange(
                        path,
                        value.filter((_, j) => j !== i),
                      );
                    }}
                  />
                )}
              </div>
              {open && (
                <div className="list-item-body" id={bodyId}>
                  <Fields fields={f.fields} value={item} path={[...path, i]} ctx={ctx} />
                </div>
              )}
            </li>
          );
        })}
      </ol>
      {!f.fixed && f.newItem && (
        <button
          type="button"
          className="btn-admin secondary"
          disabled={full}
          onClick={() => {
            const item = f.newItem!();
            const k = itemKey(item);
            setKeys([...current, k]);
            setOpened((prev) => new Set(prev).add(k));
            ctx.onChange(path, [...value, item]);
          }}
        >
          {/* One string: screen readers drop a space that React renders as its own text node. */}
          {full ? `Up to ${f.max} ${f.itemName}s` : `+ Add ${/^[aeiou]/.test(f.itemName) ? "an" : "a"} ${f.itemName}`}
        </button>
      )}
    </div>
  );
}

function PhotosField({ field: f, value, path, ctx }: { field: Extract<Field, { kind: "photos" }>; value: Photo[]; path: Path; ctx: FieldCtx }) {
  const error = ctx.errors[keyOf(path)];
  const [current, setKeys] = useItemKeys(value);
  return (
    <div className="list" id={idFor(path)}>
      <div className="list-head">
        <h3>{f.label}</h3>
        {f.help && <p className="help">{f.help}</p>}
        <ErrorText id={`${idFor(path)}-error`} text={error} />
      </div>
      {value.length === 0 && <p className="help">No photos. The section shows without them.</p>}
      <ol className="list-items">
        {value.map((p, i) => {
          const itemPath = [...path, i];
          return (
            <li key={current[i]} className="list-item">
              <div className="list-item-head">
                <strong>Photo {i + 1}</strong>
                <ItemTools
                  index={i}
                  count={value.length}
                  what="photo"
                  onMove={(to) => {
                    setKeys(move(current, i, to));
                    ctx.onChange(path, move(value, i, to));
                  }}
                  onRemove={() => {
                    setKeys(current.filter((_, j) => j !== i));
                    ctx.onChange(
                      path,
                      value.filter((_, j) => j !== i),
                    );
                  }}
                />
              </div>
              <div className="list-item-body">
                <PhotoField
                  id={idFor(itemPath)}
                  label={`Photo ${i + 1}`}
                  value={p}
                  onChange={(v) => ctx.onChange(itemPath, v)}
                  errors={{ src: ctx.errors[`${keyOf(itemPath)}.src`], alt: ctx.errors[`${keyOf(itemPath)}.alt`] }}
                  uploadMode={ctx.uploadMode}
                  savedSrc={(ctx.savedAt?.(itemPath) as { src?: string } | undefined)?.src}
                />
              </div>
            </li>
          );
        })}
      </ol>
      <button
        type="button"
        className="btn-admin secondary"
        disabled={value.length >= f.max}
        onClick={() => {
          setKeys([...current, itemKey({})]);
          ctx.onChange(path, [...value, { src: "", alt: "", focus: "50% 50%" }]);
        }}
      >
        {value.length >= f.max ? `Up to ${f.max} photos` : "+ Add a photo"}
      </button>
    </div>
  );
}

function StringsField({ field: f, value, path, ctx }: { field: Extract<Field, { kind: "strings" }>; value: string[]; path: Path; ctx: FieldCtx }) {
  const error = ctx.errors[keyOf(path)];
  const [current, setKeys] = useItemKeys(value);
  const name = `${f.itemName[0].toUpperCase()}${f.itemName.slice(1)}`;
  return (
    <div className="list" id={idFor(path)}>
      <div className="list-head">
        <h3>{f.label}</h3>
        {f.help && <p className="help">{f.help}</p>}
        <ErrorText id={`${idFor(path)}-error`} text={error} />
      </div>
      <ol className="list-items">
        {value.map((item, i) => {
          const id = idFor([...path, i]);
          const itemError = ctx.errors[keyOf([...path, i])];
          const set = (v: string) => ctx.onChange(path, value.map((x, j) => (j === i ? v : x)));
          const aria = { "aria-invalid": itemError ? true : undefined, "aria-describedby": itemError ? `${id}-error` : undefined };
          return (
            <li key={current[i]} className="list-item compact">
              <label htmlFor={id}>
                {name} {i + 1}
              </label>
              {f.multiline ? (
                <textarea id={id} value={item} maxLength={f.maxLength} rows={4} onChange={(e) => set(e.target.value)} {...aria} />
              ) : (
                <input id={id} type="text" value={item} maxLength={f.maxLength} onChange={(e) => set(e.target.value)} {...aria} />
              )}
              <ErrorText id={`${id}-error`} text={itemError} />
              <ItemTools
                index={i}
                count={value.length}
                what={f.itemName}
                onMove={(to) => {
                  setKeys(move(current, i, to));
                  ctx.onChange(path, move(value, i, to));
                }}
                onRemove={() => {
                  setKeys(current.filter((_, j) => j !== i));
                  ctx.onChange(
                    path,
                    value.filter((_, j) => j !== i),
                  );
                }}
              />
            </li>
          );
        })}
      </ol>
      <button
        type="button"
        className="btn-admin secondary"
        disabled={value.length >= f.max}
        onClick={() => {
          setKeys([...current, itemKey("")]);
          ctx.onChange(path, [...value, ""]);
        }}
      >
        {value.length >= f.max ? `Up to ${f.max} ${f.itemName}s` : `+ Add ${/^[aeiou]/.test(f.itemName) ? "an" : "a"} ${f.itemName}`}
      </button>
    </div>
  );
}
