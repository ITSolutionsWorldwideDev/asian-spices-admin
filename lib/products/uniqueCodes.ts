type Queryable = {
  query: (text: string, params?: any[]) => Promise<{ rows: any[] }>;
};

export type ProductCodeConflict = {
  field: "sku" | "item_code";
  error: string;
};

export function normalizeProductCode(value: unknown): string {
  return String(value ?? "").trim();
}

export function uniqueViolationField(constraint?: string): "sku" | "item_code" | null {
  const name = String(constraint ?? "").toLowerCase();
  if (name.includes("item_code")) return "item_code";
  if (name.includes("sku")) return "sku";
  return null;
}

export function uniqueViolationResponse(constraint?: string): ProductCodeConflict {
  const field = uniqueViolationField(constraint);
  if (field === "item_code") {
    return { field, error: "Item code already exists on another product" };
  }
  if (field === "sku") {
    return { field, error: "SKU already exists on another product" };
  }
  return {
    field: "sku",
    error: "A product with this SKU or item code already exists",
  };
}

export async function findProductCodeConflict(
  db: Queryable,
  input: {
    sku?: unknown;
    item_code?: unknown;
    excludeId?: string | null;
  },
): Promise<ProductCodeConflict | null> {
  const sku = normalizeProductCode(input.sku);
  const itemCode = normalizeProductCode(input.item_code);

  if (sku) {
    const params: any[] = [sku];
    let sql = `
      SELECT 1
      FROM store_products
      WHERE LOWER(TRIM(sku)) = LOWER($1)
    `;
    if (input.excludeId) {
      params.push(input.excludeId);
      sql += ` AND id <> $${params.length}`;
    }
    sql += " LIMIT 1";

    const existing = await db.query(sql, params);
    if (existing.rows.length) {
      return { field: "sku", error: "SKU already exists on another product" };
    }
  }

  if (itemCode) {
    const params: any[] = [itemCode];
    let sql = `
      SELECT 1
      FROM store_products
      WHERE LOWER(TRIM(item_code)) = LOWER($1)
    `;
    if (input.excludeId) {
      params.push(input.excludeId);
      sql += ` AND id <> $${params.length}`;
    }
    sql += " LIMIT 1";

    const existing = await db.query(sql, params);
    if (existing.rows.length) {
      return {
        field: "item_code",
        error: "Item code already exists on another product",
      };
    }
  }

  return null;
}
