// Which fields differ between two versions of the site content, as paths (["home", "about", "heading"]). A list
// that gained or lost items counts as one change to the whole list. Used to describe, undo and revert saves.
export type Path = (string | number)[];

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

/** A photo ({ src, alt, focus, … }) changes as one thing, so undoing or reverting it never mixes two files' sizes. */
const isPhoto = (v: unknown) => isObject(v) && typeof v.src === "string" && "focus" in v;

/** Every path where `a` and `b` differ. Photos and lists that changed length count as one change each. */
export function changedPaths(a: unknown, b: unknown, limit = 60): Path[] {
  const out: Path[] = [];
  const walk = (x: unknown, y: unknown, path: Path) => {
    if (out.length >= limit) return;
    if (isObject(x) && isObject(y) && !isPhoto(x) && !isPhoto(y)) {
      for (const k of new Set([...Object.keys(x), ...Object.keys(y)])) walk(x[k], y[k], [...path, k]);
    } else if (Array.isArray(x) && Array.isArray(y) && x.length === y.length) {
      x.forEach((item, i) => walk(item, y[i], [...path, i]));
    } else if (JSON.stringify(x) !== JSON.stringify(y)) {
      out.push(path);
    }
  };
  walk(a, b, []);
  return out;
}

export function getAt(obj: unknown, path: readonly (string | number)[]): unknown {
  return path.reduce<unknown>((o, k) => (o as Record<string | number, unknown> | undefined)?.[k], obj);
}

export function setAt<T>(obj: T, path: readonly (string | number)[], value: unknown): T {
  if (!path.length) return value as T;
  const [k, ...rest] = path;
  const src = obj as Record<string | number, unknown>;
  const copy = (Array.isArray(obj) ? [...(obj as unknown[])] : { ...(obj as object) }) as Record<string | number, unknown>;
  copy[k] = setAt(src?.[k], rest, value);
  return copy as T;
}

export const sameValue = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
