type Queryable = {
  query: (text: string, params?: any[]) => Promise<{ rows: any[] }>;
};

export const ITEM_CODE_PREFIX = "ITM";
const MIN_ITEM_CODE_DIGITS = 5;

export function formatSequentialItemCode(
  sequence: number,
  minDigits = MIN_ITEM_CODE_DIGITS,
): string {
  const digits = Math.max(minDigits, String(sequence).length);
  return `${ITEM_CODE_PREFIX}${String(sequence).padStart(digits, "0")}`;
}

/** Highest sequence from item codes like ITM00001 (also counts legacy formats). */
export async function getMaxNumericItemCodeSequence(
  db: Queryable,
): Promise<number> {
  const result = await db.query(`
    SELECT COALESCE(MAX(
      CASE
        WHEN TRIM(item_code) ~ '^ITM[0-9]+$'
          THEN CAST(SUBSTRING(TRIM(item_code) FROM 4) AS INTEGER)
        WHEN TRIM(item_code) ~ '^IT-[A-Z0-9-]+$'
          THEN NULL
        WHEN TRIM(item_code) ~ '^[0-9]+$'
          THEN CAST(TRIM(item_code) AS INTEGER)
        ELSE NULL
      END
    ), 0) AS max_seq
    FROM store_products
  `);

  return Number(result.rows[0]?.max_seq ?? 0);
}

export function createSequentialItemCodeAllocator(startSequence: number) {
  let current = startSequence;

  return {
    next(): string {
      current += 1;
      return formatSequentialItemCode(current);
    },
  };
}

export async function allocateNextItemCode(db: Queryable): Promise<string> {
  const maxSeq = await getMaxNumericItemCodeSequence(db);
  return createSequentialItemCodeAllocator(maxSeq).next();
}
