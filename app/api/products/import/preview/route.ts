// apps/admin/app/api/products/import/preview/route.ts
import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { pool } from "@/core/db";

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

  const client = await pool.connect();

  try {
    
    /* ---------------- FETCH STRUCTURAL LOOKUPS FOR VALIDATION ---------------- */
    const [existingSkus, categories, subcategories, brands] = await Promise.all([
      client.query(`SELECT sku FROM store_products`),
      client.query(`SELECT name FROM store_categories WHERE status = 1`),
      client.query(`SELECT name FROM store_subcategories WHERE status = 1`),
      client.query(`SELECT name FROM store_brands WHERE status = true`)
    ]);

    
    // const skuSet = new Set(existingSkus.rows.map(r => r.sku));
    // const catSet = new Set(categories.rows.map(r => r.name.toLowerCase().trim()));
    // const subSet = new Set(subcategories.rows.map(r => r.name.toLowerCase().trim()));
    // const brandSet = new Set(brands.rows.map(r => r.name.toLowerCase().trim()));

    const skuSet = new Set(existingSkus.rows.map((r: { sku: string }) => r.sku));
    const catSet = new Set(categories.rows.map((r: { name: string }) => r.name.toLowerCase().trim()));
    const subSet = new Set(subcategories.rows.map((r: { name: string }) => r.name.toLowerCase().trim()));
    const brandSet = new Set(brands.rows.map((r: { name: string }) => r.name.toLowerCase().trim()));

    // const result = [];
    const result: Array<{ row: number; data: any; isValid: boolean; errors: string[] }> = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];

      const errors: string[] = [];

      /* ---------------- VALIDATION ---------------- */

      if (!row.Name) errors.push("Name is required");
      if (!row.SKU) errors.push("SKU is required");
      if (!row.Price) errors.push("Price is required");

      /* ---------------- DUPLICATE SKU CHECK ---------------- */

      if (skuSet.has(row.SKU)) {
        errors.push("Duplicate SKU already exists");
      }
      
      /* ---------------- TEXT RELATIONSHIP EXISTENCE LOOKUPS ---------------- */
      if (row.Category) {
        if (!catSet.has(String(row.Category).toLowerCase().trim())) {
          errors.push(`Category '${row.Category}' does not exist or is inactive`);
        }
      }
      if (row.Subcategory) {
        if (!subSet.has(String(row.Subcategory).toLowerCase().trim())) {
          errors.push(`Subcategory '${row.Subcategory}' does not exist or is inactive`);
        }
      }
      if (row.Brand) {
        if (!brandSet.has(String(row.Brand).toLowerCase().trim())) {
          errors.push(`Brand '${row.Brand}' does not exist or is inactive`);
        }
      }

      /* ---------------- JSON VALIDATION ---------------- */

      try {
        if (row["B2B Prices"]) {
          JSON.parse(row["B2B Prices"]);
        }
      } catch {
        errors.push("Invalid B2B JSON");
      }

      /* ---------------- ROW RESULT ---------------- */

      result.push({
        row: i + 2,
        data: row,
        isValid: errors.length === 0,
        errors,
      });
    }

    return NextResponse.json({
      total: rows.length,
      valid: result.filter(r => r.isValid).length,
      invalid: result.filter(r => !r.isValid).length,
      rows: result,
    });

  } finally {
    client.release();
  }
}