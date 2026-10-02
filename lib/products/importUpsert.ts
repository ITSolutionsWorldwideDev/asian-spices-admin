// lib/products/importUpsert.ts

import { normalizeProductCode } from "@/lib/products/uniqueCodes";
import { excelWeight } from "@/lib/products/excelRow";
import { productSlug } from "@/lib/utils/slugify";

export type ImportAction = "create" | "update" | "skip";

export type ExistingProduct = {
  id: number;
  sku: string | null;
  item_code: string | null;
  name: string;
  slug: string | null;
  description: string | null;
  health_benefits: string | null;
  base_price: number | null;
  weight: string | null;
  quantity: number | null;
  discount_type: string | null;
  discount_value: number | null;
  status: number | null;
  country_of_origin: string | null;
  category: string | null;
  subcategory: string | null;
  brand: string | null;
  b2b_prices: Array<{ min_quantity: number; price: number }> | null;
};

export type ResolvedImportValues = {
  name: string;
  slug: string;
  sku: string;
  itemCode: string;
  category: string;
  subcategory: string;
  brand: string;
  countryOfOrigin: string | null;
  description: string | null;
  healthBenefits: string | null;
  basePrice: number;
  weight: string | null;
  quantity: number;
  discountType: string | null;
  discountValue: number | null;
  status: number;
  b2bPrices: Array<{ min_quantity: number; price: number }> | null;
  b2bPricesProvided: boolean;
};

const DEFAULT_QUANTITY = 9999;

function normText(value: unknown): string {
  return String(value ?? "").trim();
}

function normKey(value: unknown): string {
  return normText(value).toLowerCase();
}

function normNullable(value: unknown): string | null {
  const text = normText(value);
  return text === "" ? null : text;
}

function normNumber(value: unknown): number | null {
  if (value === undefined || value === null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function parseB2bPrices(
  raw: unknown,
): Array<{ min_quantity: number; price: number }> | null {
  if (raw === undefined || raw === null || String(raw).trim() === "") {
    return null;
  }
  try {
    const parsed = JSON.parse(String(raw));
    if (!Array.isArray(parsed)) return null;
    return parsed
      .map((t) => ({
        min_quantity: Number(t.min_quantity),
        price: Number(t.price),
      }))
      .filter((t) => Number.isFinite(t.min_quantity) && Number.isFinite(t.price))
      .sort((a, b) => a.min_quantity - b.min_quantity);
  } catch {
    return null;
  }
}

function b2bKey(
  tiers: Array<{ min_quantity: number; price: number }> | null | undefined,
): string {
  if (!tiers?.length) return "";
  return JSON.stringify(
    tiers.map((t) => ({
      min_quantity: Number(t.min_quantity),
      price: Number(t.price),
    })),
  );
}

export function resolveImportValues(
  row: Record<string, unknown>,
  opts: {
    sku: string;
    itemCode: string;
  },
): ResolvedImportValues {
  const weight = excelWeight(row);
  const quantityRaw = row.Quantity;
  const quantity =
    quantityRaw === undefined || quantityRaw === ""
      ? DEFAULT_QUANTITY
      : Number(quantityRaw);

  const b2bRaw = row["B2B Prices"];
  const b2bPricesProvided =
    b2bRaw !== undefined && b2bRaw !== null && String(b2bRaw).trim() !== "";

  return {
    name: normText(row.Name),
    slug: productSlug(
      normText(row.Slug) || normText(row.Name),
      weight,
    ),
    sku: opts.sku,
    itemCode: opts.itemCode,
    category: normText(row.Category),
    subcategory: normText(row.Subcategory),
    brand: normText(row.Brand),
    countryOfOrigin: normNullable(row["Country of Origin"]),
    description: normNullable(row.Description),
    healthBenefits: normNullable(row["Health Benefits"]),
    basePrice: Number(row["Base Price"]),
    weight,
    quantity,
    discountType: normNullable(row["Discount Type"]),
    discountValue: normNumber(row["Discount Value"]),
    status: normText(row.Status) === "Inactive" ? 0 : 1,
    b2bPrices: b2bPricesProvided ? parseB2bPrices(b2bRaw) : null,
    b2bPricesProvided,
  };
}

/** Match key for import upsert: name + brand + weight (not SKU / item code). */
export function productIdentityKey(
  name: unknown,
  brand: unknown,
  weight: unknown,
): string {
  const weightKey = normText(weight)
    .toLowerCase()
    .replace(/(\d+)\s*([a-zA-Z]+)/g, "$1$2")
    .replace(/\s+/g, "");
  return `${normKey(name)}|${normKey(brand)}|${weightKey}`;
}

export function findExistingProduct(
  row: Record<string, unknown>,
  byIdentity: Map<string, ExistingProduct>,
): {
  existing: ExistingProduct | null;
  conflict: string | null;
} {
  const name = normText(row.Name);
  const brand = normText(row.Brand);
  if (!name || !brand) {
    return { existing: null, conflict: null };
  }

  const key = productIdentityKey(name, brand, excelWeight(row) ?? row.Weight);
  return {
    existing: byIdentity.get(key) ?? null,
    conflict: null,
  };
}

/** Field labels that differ between DB product and import row (for preview). */
export function getProductChanges(
  existing: ExistingProduct,
  next: ResolvedImportValues,
): string[] {
  const changes: string[] = [];

  if (normKey(existing.name) !== normKey(next.name)) changes.push("Name");
  if (normText(existing.slug) !== next.slug) changes.push("Slug");
  if (
    normalizeProductCode(existing.sku).toLowerCase() !== next.sku.toLowerCase()
  )
    changes.push("SKU");
  if (
    normalizeProductCode(existing.item_code).toLowerCase() !==
    next.itemCode.toLowerCase()
  )
    changes.push("Item Code");
  if (normKey(existing.category) !== normKey(next.category))
    changes.push("Category");
  if (normKey(existing.subcategory) !== normKey(next.subcategory))
    changes.push("Subcategory");
  if (normKey(existing.brand) !== normKey(next.brand)) changes.push("Brand");
  if (normKey(existing.country_of_origin) !== normKey(next.countryOfOrigin))
    changes.push("Country of Origin");
  if (normText(existing.description) !== normText(next.description))
    changes.push("Description");
  if (normText(existing.health_benefits) !== normText(next.healthBenefits))
    changes.push("Health Benefits");
  if (Number(existing.base_price ?? 0) !== Number(next.basePrice))
    changes.push("Base Price");
  if (normText(existing.weight) !== normText(next.weight))
    changes.push("Weight");
  if (Number(existing.quantity ?? 0) !== Number(next.quantity))
    changes.push("Quantity");
  if (normKey(existing.discount_type) !== normKey(next.discountType))
    changes.push("Discount Type");
  if (Number(existing.discount_value ?? 0) !== Number(next.discountValue ?? 0))
    changes.push("Discount Value");
  if (Number(existing.status ?? 0) !== Number(next.status))
    changes.push("Status");

  if (next.b2bPricesProvided) {
    if (b2bKey(existing.b2b_prices) !== b2bKey(next.b2bPrices)) {
      changes.push("B2B Prices");
    }
  }

  return changes;
}

export function productHasChanges(
  existing: ExistingProduct,
  next: ResolvedImportValues,
): boolean {
  return getProductChanges(existing, next).length > 0;
}

export function decideImportAction(
  existing: ExistingProduct | null,
  next: ResolvedImportValues,
): ImportAction {
  if (!existing) return "create";
  return productHasChanges(existing, next) ? "update" : "skip";
}

export { DEFAULT_QUANTITY };
