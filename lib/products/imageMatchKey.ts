// lib/products/imageMatchKey.ts

/** "50g" → "50 g", "50 g" → "50 g" */
export function normalizeWeight(weight: string): string {
  return weight.trim().replace(/(\d+)\s*([a-zA-Z]+)/g, "$1 $2");
}

/** Lowercase, strip punctuation/spaces so "5 kg", "5kg", and "5-kg" all match. */
function toMatchKey(value: string): string {
  return value
    .toLowerCase()
    .replace(/(\d+)\s*([a-zA-Z]+)/g, (_, num, unit) => `${num}${unit.toLowerCase()}`)
    .replace(/[^a-z0-9]/g, "");
}

export function buildProductMatchKey(
  name: string,
  weight?: string | null,
): string {
  const trimmedName = name.trim();
  const trimmedWeight = weight?.trim();
  if (!trimmedWeight) return toMatchKey(trimmedName);
  return toMatchKey(`${trimmedName}-${normalizeWeight(trimmedWeight)}`);
}

export function filenameToMatchKey(fileName: string): string {
  const withoutExt = fileName.replace(/\.[^.]+$/, "");
  // Drop a leading catalog number like "456-" / "456_" so it is not part of the match.
  const withoutPrefix = withoutExt.replace(/^\d+[-_\s]+/, "");
  return toMatchKey(withoutPrefix);
}
