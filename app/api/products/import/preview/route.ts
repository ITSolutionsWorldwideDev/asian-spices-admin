// app/api/products/import/preview/route.ts
import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { pool } from "@/core/db";
import { normalizeProductCode } from "@/lib/products/uniqueCodes";
import {
  createSequentialSkuAllocator,
  getMaxNumericSkuSequence,
} from "@/lib/products/sku";
import {
  createSequentialItemCodeAllocator,
  getMaxNumericItemCodeSequence,
} from "@/lib/products/itemCode";
import { excelWeight, normalizeExcelRow } from "@/lib/products/excelRow";
import {
  decideImportAction,
  findExistingProduct,
  getProductChanges,
  productIdentityKey,
  resolveImportValues,
  type ExistingProduct,
  type ImportAction,
} from "@/lib/products/importUpsert";

const REQUIRED_HEADERS = [
  "Name",
  "Category",
  "Subcategory",
  "Brand",
  "Base Price",
];

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File;

  if (!file) {
    return NextResponse.json({ error: "File required" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<any>(sheet).map((row) =>
    normalizeExcelRow(row),
  );

  /* ---------------- WRONG-TEMPLATE GUARDRAIL ---------------- */
  const foundHeaders = rows.length
    ? new Set(Object.keys(rows[0]))
    : new Set<string>();
  const missingHeaders = REQUIRED_HEADERS.filter((h) => !foundHeaders.has(h));

  if (!rows.length || missingHeaders.length >= REQUIRED_HEADERS.length / 2) {
    return NextResponse.json({
      wrongTemplate: true,
      error: `This doesn't look like the current product import template (missing columns: ${missingHeaders.join(", ") || "all"}). Download the template from this dialog and re-fill it — don't reuse an older export.`,
      total: 0,
      valid: 0,
      invalid: 0,
      create: 0,
      update: 0,
      skip: 0,
      rows: [],
    });
  }

  const client = await pool.connect();

  try {
    const existingRes = await client.query<ExistingProduct>(`
      SELECT
        p.id,
        p.sku,
        p.item_code,
        p.name,
        p.slug,
        p.description,
        p.health_benefits,
        p.base_price,
        p.weight,
        p.quantity,
        p.discount_type,
        p.discount_value,
        p.status,
        p.country_of_origin,
        c.name AS category,
        sc.name AS subcategory,
        b.name AS brand,
        (
          SELECT COALESCE(
            json_agg(
              json_build_object(
                'min_quantity', spp.min_quantity,
                'price', spp.price
              )
              ORDER BY spp.min_quantity ASC
            ),
            '[]'::json
          )
          FROM store_product_prices spp
          WHERE spp.product_id = p.id
            AND spp.customer_type = 'B2B'
        ) AS b2b_prices
      FROM store_products p
      LEFT JOIN store_categories c ON c.id = p.category_id
      LEFT JOIN store_subcategories sc ON sc.id = p.subcategory_id
      LEFT JOIN store_brands b ON b.brand_id = p.brand_id
    `);

    const bySku = new Map<string, ExistingProduct>();
    const byItemCode = new Map<string, ExistingProduct>();
    const byIdentity = new Map<string, ExistingProduct>();

    for (const product of existingRes.rows) {
      const skuKey = normalizeProductCode(product.sku).toLowerCase();
      const itemKey = normalizeProductCode(product.item_code).toLowerCase();
      if (skuKey) bySku.set(skuKey, product);
      if (itemKey) byItemCode.set(itemKey, product);
      const identityKey = productIdentityKey(
        product.name,
        product.brand,
        product.weight,
      );
      if (identityKey !== "||") byIdentity.set(identityKey, product);
      if (!Array.isArray(product.b2b_prices)) {
        product.b2b_prices = [];
      }
    }

    const maxSkuSeq = await getMaxNumericSkuSequence(client);
    const skuAllocator = createSequentialSkuAllocator(maxSkuSeq);
    const maxItemCodeSeq = await getMaxNumericItemCodeSequence(client);
    const itemCodeAllocator = createSequentialItemCodeAllocator(maxItemCodeSeq);

    const result: Array<{
      row: number;
      data: any;
      isValid: boolean;
      action: ImportAction | "error";
      changes: string[];
      fieldErrors: Record<string, string>;
      errors: string[];
    }> = [];

    const skusSeenInFile = new Set<string>();
    const itemCodesSeenInFile = new Set<string>();

    for (let i = 0; i < rows.length; i++) {
      const row = { ...rows[i] };
      const weight = excelWeight(row);
      if (weight) row.Weight = weight;
      else delete row.Weight;

      const fieldErrors: Record<string, string> = {};

      if (!row.Name) fieldErrors.Name = "required";
      if (!row.Category) fieldErrors.Category = "required";
      if (!row.Subcategory) fieldErrors.Subcategory = "required";
      if (!String(row.Brand ?? "").trim()) fieldErrors.Brand = "required";

      if (!row["Base Price"]) {
        fieldErrors["Base Price"] = "required";
      } else if (
        Number.isNaN(Number(row["Base Price"])) ||
        Number(row["Base Price"]) <= 0
      ) {
        fieldErrors["Base Price"] = "must be a number > 0";
      }

      if (
        row.Quantity !== undefined &&
        row.Quantity !== "" &&
        (Number.isNaN(Number(row.Quantity)) || Number(row.Quantity) < 0)
      ) {
        fieldErrors.Quantity = "must be a whole number ≥ 0";
      }

      const providedSku = normalizeProductCode(row.SKU);
      const providedItemCode = normalizeProductCode(row["Item Code"]);
      const { existing, conflict } = findExistingProduct(row, byIdentity);

      if (conflict) {
        fieldErrors.Name = conflict;
      }

      if (providedSku) {
        const skuKey = providedSku.toLowerCase();
        if (skusSeenInFile.has(skuKey)) {
          fieldErrors.SKU = "duplicated in this file";
        } else {
          skusSeenInFile.add(skuKey);
        }
      }

      if (providedItemCode) {
        const itemCodeKey = providedItemCode.toLowerCase();
        if (itemCodesSeenInFile.has(itemCodeKey)) {
          fieldErrors["Item Code"] = "duplicated in this file";
        } else {
          itemCodesSeenInFile.add(itemCodeKey);
        }
      }

      if (
        row.Status &&
        !["Active", "Inactive"].includes(String(row.Status).trim())
      ) {
        fieldErrors.Status = "must be Active or Inactive";
      }

      if (row["B2B Prices"]) {
        try {
          JSON.parse(String(row["B2B Prices"]));
        } catch {
          fieldErrors["B2B Prices"] = "invalid JSON";
        }
      }

      let action: ImportAction | "error" = "error";
      let changes: string[] = [];

      if (Object.keys(fieldErrors).length === 0) {
        let sku = providedSku;
        let itemCode = providedItemCode;

        if (existing) {
          sku = providedSku || normalizeProductCode(existing.sku);
          itemCode =
            providedItemCode || normalizeProductCode(existing.item_code);

          // Changing SKU/item code must not collide with a different product.
          const skuOwner = sku ? bySku.get(sku.toLowerCase()) : undefined;
          const itemOwner = itemCode
            ? byItemCode.get(itemCode.toLowerCase())
            : undefined;

          if (skuOwner && skuOwner.id !== existing.id) {
            fieldErrors.SKU = "already used by another product";
          }
          if (itemOwner && itemOwner.id !== existing.id) {
            fieldErrors["Item Code"] = "already used by another product";
          }
        } else {
          if (sku && bySku.has(sku.toLowerCase())) {
            fieldErrors.SKU = "already used by another product";
          }
          if (itemCode && byItemCode.has(itemCode.toLowerCase())) {
            fieldErrors["Item Code"] = "already used by another product";
          }

          if (!sku) {
            sku = skuAllocator.next();
            while (
              bySku.has(sku.toLowerCase()) ||
              skusSeenInFile.has(sku.toLowerCase())
            ) {
              sku = skuAllocator.next();
            }
            skusSeenInFile.add(sku.toLowerCase());
          }
          if (!itemCode) {
            itemCode = itemCodeAllocator.next();
            while (
              byItemCode.has(itemCode.toLowerCase()) ||
              itemCodesSeenInFile.has(itemCode.toLowerCase())
            ) {
              itemCode = itemCodeAllocator.next();
            }
            itemCodesSeenInFile.add(itemCode.toLowerCase());
          }
        }

        if (Object.keys(fieldErrors).length === 0) {
          row.SKU = sku;
          row["Item Code"] = itemCode;

          const values = resolveImportValues(row, { sku, itemCode });
          action = decideImportAction(existing, values);
          if (existing && action === "update") {
            changes = getProductChanges(existing, values);
          }
        }
      }

      const errors = Object.entries(fieldErrors).map(
        ([field, message]) => `${field}: ${message}`,
      );

      result.push({
        row: i + 2,
        data: row,
        isValid: errors.length === 0,
        action: errors.length === 0 ? action : "error",
        changes,
        fieldErrors,
        errors,
      });
    }

    return NextResponse.json({
      total: rows.length,
      valid: result.filter((r) => r.isValid).length,
      invalid: result.filter((r) => !r.isValid).length,
      create: result.filter((r) => r.action === "create").length,
      update: result.filter((r) => r.action === "update").length,
      skip: result.filter((r) => r.action === "skip").length,
      rows: result,
    });
  } finally {
    client.release();
  }
}
