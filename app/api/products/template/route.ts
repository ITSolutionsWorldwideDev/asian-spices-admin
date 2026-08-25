// app/api/products/template/route.ts

import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { pool } from "@/core/db";

interface QueryRowItem {
  id: number | string;
  name: string;
}

export async function GET() {
  const client = await pool.connect();

  try {
    /* ---------------- FETCH DATA ----------------
       Category, subcategory, and brand are free text on import (auto-created if missing). */

    const countries = await client.query<QueryRowItem>(`
      SELECT country_id AS id, country_name AS name
      FROM countries
      ORDER BY country_name
    `);

    const workbook = new ExcelJS.Workbook();

    /* ---------------- PRODUCTS SHEET ---------------- */

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

    // `sheet.columns` is empty until rows exist, so setting `.width` on it
    // here was a no-op — every column rendered at Excel's default (narrow)
    // width. Assigning column defs up front actually sizes them.
    sheet.columns = headers.map(() => ({ width: 24 }));

    sheet.views = [{ state: "frozen", ySplit: 1 }];

    sheet.getRow(1).eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFEFEFEF" },
      };
    });

    sheet.addRow(headers);

    // Category, subcategory, and brand can be any name (created on import).
    const sampleCountry = countries.rows[0];

    sheet.addRow([
      "Sample Product",
      "slug",
      "",
      "",
      "Spices & Herbs",
      "Ground Spices",
      "Asian Spices",
      "India",
      " description",
      "health benefit",
      100,
      "500g",
      9999,
      "PERCENT",
      10,
      "Active",
      "",
      '[{"min_quantity":10,"price":90}]',
    ]);

    sheet.addRow([
      "Product Name",
      "Slug",
      "",
      "",
      "Category",
      "Subcategory",
      "Brand",
      "Pakistan",
      "Description",
      "Health Benefits",
      150,
      "1 kg",
      9999,
      "PERCENT",
      10,
      "Active",
      "",
      '[{"min_quantity":10,"price":90}]',
    ]);

    sheet.getRow(1).font = { bold: true };
    sheet.getRow(3).font = { italic: true, color: { argb: "FF6B7280" } };

    /* ---------------- LOOKUP SHEETS ---------------- */

    const countrySheet = workbook.addWorksheet("Countries");
    countries.rows.forEach((r, i) => {
      countrySheet.getCell(`A${i + 1}`).value = r.name;
    });

    /* ---------------- HIDE LOOKUPS ---------------- */

    countrySheet.state = "hidden";

    /* ---------------- DROPDOWNS ---------------- */

    for (let i = 2; i <= 200; i++) {
      sheet.getCell(`H${i}`).dataValidation = {
        type: "list",
        allowBlank: true,
        showErrorMessage: true,
        error: "Select a valid Countries",
        formulae: [`Countries!$A$1:$A$${countries.rows.length}`],
      };
    }

    /* ---------------- RESPONSE ---------------- */

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": "attachment; filename=products-sample.xlsx",
      },
    });
  } finally {
    client.release();
  }
}
