// app/api/products/export/route.ts

import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { requirePlatformAdmin } from "@/lib/auth/guards";
import { pool } from "@/core/db";

type ExportRow = {
  name: string;
  slug: string | null;
  sku: string | null;
  item_code: string | null;
  category: string | null;
  subcategory: string | null;
  brand: string | null;
  country_of_origin: string | null;
  description: string | null;
  health_benefits: string | null;
  base_price: number | null;
  weight: string | null;
  quantity: number | null;
  discount_type: string | null;
  discount_value: number | null;
  status: number | null;
  images: string | null;
  b2b_prices: unknown;
};

export async function GET() {
  await requirePlatformAdmin();

  const { rows } = await pool.query<ExportRow>(`
    SELECT
      p.name,
      p.slug,
      p.sku,
      p.item_code,
      c.name AS category,
      sc.name AS subcategory,
      b.name AS brand,
      COALESCE(co.country_name, p.country_of_origin) AS country_of_origin,
      p.description,
      p.health_benefits,
      p.base_price,
      p.weight,
      p.quantity,
      p.discount_type,
      p.discount_value,
      p.status,
      (
        SELECT string_agg(spi.url, ',' ORDER BY spi.sort_order ASC NULLS LAST, spi.id ASC)
        FROM store_product_images spi
        WHERE spi.product_id = p.id
      ) AS images,
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
    LEFT JOIN countries co ON co.country_id = p.country_id
    ORDER BY p.name ASC
  `);

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Products");

  const headers = [
    "Name",
    "Slug",
    "SKU",
    "Item Code",
    "Category",
    "Subcategory",
    "Brand",
    "Country of Origin",
    "Description",
    "Health Benefits",
    "Base Price",
    "Weight",
    "Quantity",
    "Discount Type",
    "Discount Value",
    "Status",
    "Images",
    "B2B Prices",
  ];

  sheet.columns = headers.map((header) => ({
    header,
    width: header === "Description" || header === "Health Benefits" || header === "Images"
      ? 40
      : 22,
  }));

  sheet.views = [{ state: "frozen", ySplit: 1 }];
  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFEFEFEF" },
    };
  });

  for (const row of rows) {
    const b2b =
      Array.isArray(row.b2b_prices) && row.b2b_prices.length > 0
        ? JSON.stringify(row.b2b_prices)
        : "";

    sheet.addRow([
      row.name ?? "",
      row.slug ?? "",
      row.sku ?? "",
      row.item_code ?? "",
      row.category ?? "",
      row.subcategory ?? "",
      row.brand ?? "",
      row.country_of_origin ?? "",
      row.description ?? "",
      row.health_benefits ?? "",
      row.base_price ?? "",
      row.weight ?? "",
      row.quantity ?? "",
      row.discount_type ?? "",
      row.discount_value ?? "",
      row.status ? "Active" : "Inactive",
      row.images ?? "",
      b2b,
    ]);
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const date = new Date().toISOString().slice(0, 10);

  return new NextResponse(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="products-export-${date}.xlsx"`,
    },
  });
}
