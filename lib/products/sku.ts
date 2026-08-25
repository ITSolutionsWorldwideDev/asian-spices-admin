type Queryable = {
  query: (text: string, params?: any[]) => Promise<{ rows: any[] }>;
};

export const SKU_PREFIX = "SKU";
const MIN_SKU_DIGITS = 5;

export function formatSequentialSku(
  sequence: number,
  minDigits = MIN_SKU_DIGITS,
): string {
  const digits = Math.max(minDigits, String(sequence).length);
  return `${SKU_PREFIX}${String(sequence).padStart(digits, "0")}`;
}

/** Highest sequence from SKUs like SKU00001 (also counts legacy formats). */
export async function getMaxNumericSkuSequence(
  db: Queryable,
): Promise<number> {
  const result = await db.query(`
    SELECT COALESCE(MAX(
      CASE
        WHEN TRIM(sku) ~ '^SKU[0-9]+$'
          THEN CAST(SUBSTRING(TRIM(sku) FROM 4) AS INTEGER)
        WHEN TRIM(sku) ~ '^SKU:[0-9]+$'
          THEN CAST(SUBSTRING(TRIM(sku) FROM 5) AS INTEGER)
        WHEN TRIM(sku) ~ '^[0-9]+$'
          THEN CAST(TRIM(sku) AS INTEGER)
        ELSE NULL
      END
    ), 0) AS max_seq
    FROM store_products
  `);

  return Number(result.rows[0]?.max_seq ?? 0);
}

export function createSequentialSkuAllocator(startSequence: number) {
  let current = startSequence;

  return {
    next(): string {
      current += 1;
      return formatSequentialSku(current);
    },
  };
}

export async function allocateNextSku(db: Queryable): Promise<string> {
  const maxSeq = await getMaxNumericSkuSequence(db);
  return createSequentialSkuAllocator(maxSeq).next();
}
