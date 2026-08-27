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

/** Trailing pack size on a normalized key, e.g. "2kg", "500g", "1l". */
const TRAILING_WEIGHT_RE = /\d+(?:kg|g|ml|l|oz|lbs|lb)$/;

export function buildProductMatchKey(
  name: string,
  weight?: string | null,
): string {
  const trimmedName = name.trim();
  const trimmedWeight = weight?.trim();
  const nameKey = toMatchKey(trimmedName);

  if (!trimmedWeight) return nameKey;

  const weightKey = toMatchKey(normalizeWeight(trimmedWeight));
  // Product name already ends with the same weight → don't append it again
  // e.g. name "Heera Dal 2kg" + weight "2 kg" must not become "...2kg2kg"
  if (weightKey && nameKey.endsWith(weightKey)) {
    return nameKey;
  }

  return toMatchKey(`${trimmedName}-${normalizeWeight(trimmedWeight)}`);
}

export function filenameToMatchKey(fileName: string): string {
  const withoutExt = fileName.replace(/\.[^.]+$/, "");
  // Drop a leading catalog number even with no separator:
  // "456Product", "456-Product", "456 Product", "456_Product"
  const withoutPrefix = withoutExt.replace(/^\d+/, "").replace(/^[-_\s]+/, "");
  return toMatchKey(withoutPrefix);
}

/** Filename key without a trailing pack size (for products that have no weight in DB). */
export function filenameToMatchKeyWithoutWeight(fileName: string): string {
  return filenameToMatchKey(fileName).replace(TRAILING_WEIGHT_RE, "");
}
