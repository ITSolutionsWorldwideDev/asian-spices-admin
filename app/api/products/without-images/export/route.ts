// app/api/products/without-images/export/route.ts

import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { requirePlatformAdmin } from "@/lib/auth/guards";
import { pool } from "@/core/db";

export async function GET() {
  await requirePlatformAdmin();

  const { rows } = await pool.query<{ name: string; brand: string | null; weight: string | null }>(`
    SELECT p.name, b.name AS brand, p.weight
    FROM store_products p
    LEFT JOIN store_brands b ON b.brand_id = p.brand_id
    WHERE NOT EXISTS (
      SELECT 1 FROM store_product_images spi WHERE spi.product_id = p.id
    )
    ORDER BY p.name ASC
  `);

  const sheet = XLSX.utils.json_to_sheet(
    rows.map((r) => ({
      Name: r.name,
      Brand: r.brand ?? "",
      Weight: r.weight ?? "",
    })),
  );

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Without Images");

  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition":
        'attachment; filename="products-without-images.xlsx"',
    },
  });
}
