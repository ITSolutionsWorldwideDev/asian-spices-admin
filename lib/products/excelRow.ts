/** Trim Excel header keys so "Weight " / " Name" still match. */
export function normalizeExcelRow<T extends Record<string, unknown>>(
  row: T,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    out[String(key).replace(/^\uFEFF/, "").trim()] = value;
  }
  return out;
}

/** Read Weight from an import row (handles number cells and empty values). */
export function excelWeight(row: Record<string, unknown>): string | null {
  const raw = row.Weight ?? row.weight;
  if (raw === undefined || raw === null) return null;
  const text = String(raw).trim();
  return text === "" ? null : text;
}
