// lib/utils/slugify.ts

export function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/** "3 kg" / "3-kg" / "3kg" → "3kg" */
export function slugifyWeight(weight: string | number | null | undefined): string {
  if (weight === undefined || weight === null) return "";
  const text = String(weight).trim();
  if (!text) return "";
  return text
    .toLowerCase()
    .replace(/(\d+)\s*-?\s*([a-zA-Z]+)/g, "$1$2")
    .replace(/[^a-z0-9]/g, "");
}

/** "Red Chilli" + "3 kg" → "red-chilli-3kg" */
export function productSlug(
  nameOrSlug: string,
  weight?: string | number | null,
): string {
  const base = slugify(nameOrSlug);
  const w = slugifyWeight(weight);
  if (!w) return base;
  if (base.endsWith(`-${w}`) || base.endsWith(w)) return base;
  return `${base}-${w}`;
}