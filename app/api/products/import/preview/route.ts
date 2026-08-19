// app/api/products/import/preview/route.ts
import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { pool } from "@/core/db";

const REQUIRED_HEADERS = [
  "Name",
  "SKU",
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
  const rows = XLSX.utils.sheet_to_json<any>(sheet);

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
       Same source as the manual "Add Product" form (/api/category,
       /api/subcategory, /api/... brands): no status filter, so anything
       selectable there is also importable here. A single pg Client can't
       run concurrent queries, so these run sequentially. */

    const existingSkus = await client.query(`SELECT sku FROM store_products`);
    const categories = await client.query(
      `SELECT id, name FROM store_categories`,
    );
    const subcategories = await client.query(
      `SELECT id, name, category_id FROM store_subcategories`,
    );
    const brands = await client.query(`SELECT brand_id AS id, name FROM store_brands`);

    const skuSet = new Set(
      existingSkus.rows.map((r: { sku: string }) => r.sku),
    );

    const categoryByName = new Map(
      categories.rows.map((r: { id: number; name: string }) => [
        r.name.toLowerCase().trim(),
        r,
      ]),
    );
    const subcategoriesByName = new Map(
      subcategories.rows.map(
        (r: { id: number; name: string; category_id: number }) => [
          r.name.toLowerCase().trim(),
          r,
        ],
      ),
    );
    const brandByName = new Map(
      brands.rows.map((r: { id: number; name: string }) => [
        r.name.toLowerCase().trim(),
        r,
      ]),
    );

    const result: Array<{
      row: number;
      data: any;
      isValid: boolean;
      fieldErrors: Record<string, string>;
      errors: string[];
    }> = [];

    const skusSeenInFile = new Set<string>();

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const fieldErrors: Record<string, string> = {};

      /* ---------------- REQUIRED FIELDS ----------------
         Mirrors what the manual Add Product form requires, so a row that
         would be rejected there is rejected here too, and vice versa. */

      if (!row.Name) fieldErrors.Name = "required";
      if (!row.SKU) fieldErrors.SKU = "required";
      if (!row["Item Code"]) fieldErrors["Item Code"] = "required";
      if (!row.Category) fieldErrors.Category = "required";
      if (!row.Subcategory) fieldErrors.Subcategory = "required";
      if (!row.Brand) fieldErrors.Brand = "required";
      if (!row.Images) fieldErrors.Images = "required";

      if (!row["Base Price"]) {
        fieldErrors["Base Price"] = "required";
      } else if (Number.isNaN(Number(row["Base Price"])) || Number(row["Base Price"]) <= 0) {
        fieldErrors["Base Price"] = "must be a number > 0";
      }

      if (row.Quantity === undefined || row.Quantity === "") {
        fieldErrors.Quantity = "required";
      } else if (Number.isNaN(Number(row.Quantity)) || Number(row.Quantity) < 0) {
        fieldErrors.Quantity = "must be a whole number ≥ 0";
      }

      /* ---------------- SKU DUPLICATES ---------------- */

      if (row.SKU) {
        if (skuSet.has(row.SKU)) {
          fieldErrors.SKU = "already exists";
        } else if (skusSeenInFile.has(row.SKU)) {
          fieldErrors.SKU = "duplicated in this file";
        }
        skusSeenInFile.add(row.SKU);
      }

      /* ---------------- CATEGORY / SUBCATEGORY / BRAND EXISTENCE ---------------- */

      let matchedCategory: { id: number; name: string } | undefined;

      if (row.Category) {
        matchedCategory = categoryByName.get(
          String(row.Category).toLowerCase().trim(),
        ) as { id: number; name: string } | undefined;
        if (!matchedCategory) fieldErrors.Category = "not found";
      }

      if (row.Subcategory) {
        const matchedSub = subcategoriesByName.get(
          String(row.Subcategory).toLowerCase().trim(),
        ) as { id: number; name: string; category_id: number } | undefined;

        if (!matchedSub) {
          fieldErrors.Subcategory = "not found";
        } else if (matchedCategory && matchedSub.category_id !== matchedCategory.id) {
          fieldErrors.Subcategory = `doesn't belong to "${row.Category}"`;
        }
      }

      if (row.Brand && !brandByName.has(String(row.Brand).toLowerCase().trim())) {
        fieldErrors.Brand = "not found";
      }

      /* ---------------- STATUS ---------------- */

      if (row.Status && !["Active", "Inactive"].includes(String(row.Status).trim())) {
        fieldErrors.Status = "must be Active or Inactive";
      }

      /* ---------------- B2B PRICES (JSON) ---------------- */

      if (row["B2B Prices"]) {
        try {
          JSON.parse(row["B2B Prices"]);
        } catch {
          fieldErrors["B2B Prices"] = "invalid JSON";
        }
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
