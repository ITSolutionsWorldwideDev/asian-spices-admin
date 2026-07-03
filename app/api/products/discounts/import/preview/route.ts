// app/api/products/discounts/import/preview/route.ts
import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { pool } from "@/core/db";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File;

  if (!file) {
    return NextResponse.json(
      { error: "Excel structural binary document required" },
      { status: 400 },
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<any>(sheet);

  const client = await pool.connect();

  try {
    // Cache active database structural product matrix references
    const existingProducts = await client.query(
      `SELECT sku, id FROM store_products`,
    );
    const skuToIdMap = new Map<string, string>(
      existingProducts.rows.map((r: { sku: string; id: string }) => [
        r.sku.toLowerCase().trim(),
        r.id,
      ]),
    );

    const result: Array<{
      row: number;
      data: any;
      isValid: boolean;
      errors: string[];
    }> = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const errors: string[] = [];

      const rawSku = String(row.SKU || "")
        .toLowerCase()
        .trim();
      const customerType = String(row["Customer Type"] || "")
        .toUpperCase()
        .trim();
      const discountType = String(row["Discount Type"] || "")
        .toUpperCase()
        .trim();
      const discountValue = Number(row["Discount Value"]);

      /* Required structural boundaries */
      if (!row.SKU) errors.push("Product SKU mapping identifier missing");
      if (!row["Customer Type"])
        errors.push(
          "Customer Type scope allocation parameter required (B2C/B2B)",
        );
      if (!row["Discount Type"])
        errors.push(
          "Discount structural operational system configuration configuration rule type mismatch",
        );
      if (isNaN(discountValue) || discountValue <= 0)
        errors.push(
          "Discount Value must evaluate to a positive real number greater than 0",
        );

      /* Check product reference validity */
      if (row.SKU && !skuToIdMap.has(rawSku)) {
        errors.push(
          `Target product trace identifier for SKU reference target '${row.SKU}' could not be matched inside system catalog`,
        );
      }

      /* Validate operational string domains */
      if (customerType && customerType !== "B2C" && customerType !== "B2B") {
        errors.push(
          `Customer Type allocation key scope parameter string format identifier must read explicitly either 'B2C' or 'B2B'`,
        );
      }

      if (
        discountType &&
        discountType !== "PERCENT" &&
        discountType !== "FLAT" &&
        discountType !== "BULK"
      ) {
        errors.push(
          `Discount Type schema tracking rule option string parameter flag value must read explicitly either 'PERCENT', 'FLAT', or 'BULK'`,
        );
      }

      result.push({
        row: i + 2,
        data: row,
        isValid: errors.length === 0,
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
