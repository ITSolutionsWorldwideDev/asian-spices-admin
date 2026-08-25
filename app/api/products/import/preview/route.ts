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
  // Catches a legacy/foreign export uploaded by mistake before it turns
  // into a wall of confusing per-row "X is required" errors.
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
      rows: [],
    });
  }

  const client = await pool.connect();

  try {
    /* ---------------- STRUCTURAL LOOKUPS ----------------
       Category, subcategory, and brand are auto-created on confirm. */

    const existingCodes = await client.query(
      `SELECT sku, item_code FROM store_products`,
    );

    const skuSet = new Set(
      existingCodes.rows
        .map((r: { sku: string }) => normalizeProductCode(r.sku).toLowerCase())
        .filter(Boolean),
    );
    const itemCodeSet = new Set(
      existingCodes.rows
        .map((r: { item_code: string }) =>
          normalizeProductCode(r.item_code).toLowerCase(),
        )
        .filter(Boolean),
    );

    const maxSkuSeq = await getMaxNumericSkuSequence(client);
    const skuAllocator = createSequentialSkuAllocator(maxSkuSeq);
    const maxItemCodeSeq = await getMaxNumericItemCodeSequence(client);
    const itemCodeAllocator = createSequentialItemCodeAllocator(maxItemCodeSeq);

    const result: Array<{
      row: number;
      data: any;
      isValid: boolean;
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

      /* ---------------- REQUIRED FIELDS ----------------
         Mirrors what the manual Add Product form requires, so a row that
         would be rejected there is rejected here too, and vice versa. */

      if (!row.Name) fieldErrors.Name = "required";
      if (!row.Category) fieldErrors.Category = "required";
      if (!row.Subcategory) fieldErrors.Subcategory = "required";
      if (!String(row.Brand ?? "").trim()) fieldErrors.Brand = "required";

      if (!row["Base Price"]) {
        fieldErrors["Base Price"] = "required";
      } else if (Number.isNaN(Number(row["Base Price"])) || Number(row["Base Price"]) <= 0) {
        fieldErrors["Base Price"] = "must be a number > 0";
      }

      if (
        row.Quantity !== undefined &&
        row.Quantity !== "" &&
        (Number.isNaN(Number(row.Quantity)) || Number(row.Quantity) < 0)
      ) {
        fieldErrors.Quantity = "must be a whole number ≥ 0";
      }

      /* ---------------- SKU / ITEM CODE DUPLICATES ---------------- */

      const providedSku = normalizeProductCode(row.SKU);
      const providedItemCode = normalizeProductCode(row["Item Code"]);

      if (providedSku) {
        const skuKey = providedSku.toLowerCase();
        if (skuSet.has(skuKey)) {
          fieldErrors.SKU = "already exists";
        } else if (skusSeenInFile.has(skuKey)) {
          fieldErrors.SKU = "duplicated in this file";
        } else {
          skusSeenInFile.add(skuKey);
        }
      }

      if (providedItemCode) {
        const itemCodeKey = providedItemCode.toLowerCase();
        if (itemCodeSet.has(itemCodeKey)) {
          fieldErrors["Item Code"] = "already exists";
        } else if (itemCodesSeenInFile.has(itemCodeKey)) {
          fieldErrors["Item Code"] = "duplicated in this file";
        } else {
          itemCodesSeenInFile.add(itemCodeKey);
        }
      }

      /* ---------------- CATEGORY / SUBCATEGORY / BRAND ----------------
         Names from the sheet are accepted even if not in DB yet —
         they are created automatically during confirm import. */

      /* ---------------- STATUS ---------------- */

      if (row.Status && !["Active", "Inactive"].includes(String(row.Status).trim())) {
        fieldErrors.Status = "must be Active or Inactive";
      }

      /* ---------------- B2B PRICES (JSON) ---------------- */

      if (row["B2B Prices"]) {
        try {
          JSON.parse(String(row["B2B Prices"]));
        } catch {
          fieldErrors["B2B Prices"] = "invalid JSON";
        }
      }

      /* ---------------- AUTO SKU (optional column) ---------------- */

      if (providedSku) {
        row.SKU = providedSku;
      } else if (Object.keys(fieldErrors).length === 0) {
        const assignedSku = skuAllocator.next();
        row.SKU = assignedSku;
        skuSet.add(assignedSku.toLowerCase());
      }

      /* ---------------- AUTO ITEM CODE (optional column) ---------------- */

      if (providedItemCode) {
        row["Item Code"] = providedItemCode;
      } else if (Object.keys(fieldErrors).length === 0) {
        const assignedItemCode = itemCodeAllocator.next();
        row["Item Code"] = assignedItemCode;
        itemCodeSet.add(assignedItemCode.toLowerCase());
      }

      /* ---------------- ROW RESULT ---------------- */

      const errors = Object.entries(fieldErrors).map(
        ([field, message]) => `${field}: ${message}`,
      );

      result.push({
        row: i + 2,
        data: row,
        isValid: errors.length === 0,
        fieldErrors,
        errors,
      });
    }

    return NextResponse.json({
      total: rows.length,
      valid: result.filter((r) => r.isValid).length,
      invalid: result.filter((r) => !r.isValid).length,
      rows: result,
    });
  } finally {
    client.release();
  }
}
