// Picks a few items from an editable list for decorative "glass chips" (e.g. Facility Features items floating on
// a photo). Prefers the given items when the list still contains them (matched case-insensitively), then fills
// up from the list in order, so whatever the admin edits, the chips only ever show real content.
export function pickItems(list: readonly string[], preferred: readonly string[], count: number): string[] {
  const norm = (s: string) => s.trim().toLowerCase();
  const picked: string[] = [];
  for (const want of preferred) {
    const hit = list.find((item) => norm(item) === norm(want));
    if (hit && !picked.includes(hit)) picked.push(hit);
  }
  for (const item of list) {
    if (picked.length >= count) break;
    if (!picked.includes(item)) picked.push(item);
  }
  return picked.slice(0, count);
}
