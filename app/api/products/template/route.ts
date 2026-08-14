// app/api/products/template/route.ts

import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { pool } from "@/core/db";

interface QueryRowItem {
  id: number | string;
  name: string;
}

interface SubcategoryRowItem extends QueryRowItem {
  category_id: number | string;
}

export async function GET() {
  const client = await pool.connect();

  try {
    /* ---------------- FETCH DATA ----------------
       Same source as the manual "Add Product" form (/api/category,
       /api/subcategory): no status filter, so anything selectable there
       is also importable here. A single pg Client can't run concurrent
       queries, so these run sequentially. */

    const categories = await client.query<QueryRowItem>(`
      SELECT id, name
      FROM store_categories
      ORDER BY name
    `);

    const subcategories = await client.query<SubcategoryRowItem>(`
      SELECT id, name, category_id
      FROM store_subcategories
      ORDER BY name
    `);

    const brands = await client.query<QueryRowItem>(`
      SELECT brand_id AS id, name
      FROM store_brands
      ORDER BY name
    `);

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
      "Available Countries",
      "Description",
      "Health Benefits",
      "Base Price",
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

    // Sample row uses a real category/subcategory/brand from this store
    // so it validates as-is instead of a generic "Electronics/Apple"
    // placeholder that doesn't exist in the catalog.
    const sampleCategory = categories.rows[0];
    const sampleSubcategory = subcategories.rows.find(
      (s) => String(s.category_id) === String(sampleCategory?.id),
    );
    const sampleBrand = brands.rows[0];
    const sampleCountry = countries.rows[0];

    sheet.addRow([
      "Sample Product",
      "sample-product",
      "SKU001",
      "ITM001",
      sampleCategory?.name ?? "",
      sampleSubcategory?.name ?? "",
      sampleBrand?.name ?? "",
      sampleCountry?.name ?? "",
      sampleCountry?.name ?? "",
      "Sample description",
      "Sample benefits",
      100,
      10,
      "PERCENT",
      10,
      "Active",
      "https://example.com/img.jpg",
      '[{"min_quantity":10,"price":90}]',
    ]);

    sheet.addRow([
      "Required",
      "Optional — auto-generated from Name if blank",
      "Required, must be unique",
      "Required",
      "Required — click cell ▼",
      "Required — must match Category (checked on import)",
      "Required — click cell ▼",
      "Optional",
      "Optional, comma separated",
      "Optional",
      "Optional",
      "Required, number > 0",
      "Required, whole number ≥ 0",
      "Optional — PERCENT or FLAT",
      "Optional",
      "Optional — Active or Inactive (default Active)",
      "Required, comma separated URLs",
      "Optional — JSON, e.g. the sample above",
    ]);

    sheet.getRow(1).font = { bold: true };
    sheet.getRow(3).font = { italic: true, color: { argb: "FF6B7280" } };

    /* ---------------- LOOKUP SHEETS ---------------- */

    const catSheet = workbook.addWorksheet("Categories");
    categories.rows.forEach((r, i) => {
      catSheet.getCell(`A${i + 1}`).value = r.name;
    });

    const brandSheet = workbook.addWorksheet("Brands");
    brands.rows.forEach((r, i) => {
      brandSheet.getCell(`A${i + 1}`).value = r.name;
    });

    const countrySheet = workbook.addWorksheet("Countries");
    countries.rows.forEach((r, i) => {
      countrySheet.getCell(`A${i + 1}`).value = r.name;
    });

    /* ---------------- SUBCATEGORY ----------------
       Flat list of every subcategory rather than a per-category dependent
       dropdown: Excel's INDIRECT-based dependent dropdowns are brittle
       across Excel/Google Sheets versions and broke here even after being
       kept in sync with the named ranges. The import already validates
       that the chosen Subcategory belongs to the chosen Category and
       shows a clear error if not, so the sheet doesn't need to enforce it
       itself — a flat list is simpler and just works. */

    const subSheet = workbook.addWorksheet("Subcategories");
    subcategories.rows.forEach((r, i) => {
      subSheet.getCell(`A${i + 1}`).value = r.name;
    });

    /* ---------------- HIDE LOOKUPS ---------------- */

    catSheet.state = "hidden";
    brandSheet.state = "hidden";
    countrySheet.state = "hidden";
    subSheet.state = "hidden";

    /* ---------------- DROPDOWNS ---------------- */

    for (let i = 2; i <= 200; i++) {
      sheet.getCell(`E${i}`).dataValidation = {
        type: "list",
        allowBlank: true,
        showErrorMessage: true,
        error: "Select a valid category",
        formulae: [`Categories!$A$1:$A$${categories.rows.length}`],
      };

      sheet.getCell(`G${i}`).dataValidation = {
        type: "list",
        allowBlank: true,
        showErrorMessage: true,
        error: "Select a valid Brands",
        formulae: [`Brands!$A$1:$A$${brands.rows.length}`],
      };

      sheet.getCell(`H${i}`).dataValidation = {
        type: "list",
        allowBlank: true,
        showErrorMessage: true,
        error: "Select a valid Countries",
        formulae: [`Countries!$A$1:$A$${countries.rows.length}`],
      };

      // Flat list of all subcategories — must match the chosen Category,
      // which the import validates and reports clearly if it doesn't.
      sheet.getCell(`F${i}`).dataValidation = {
        type: "list",
        allowBlank: true,
        showErrorMessage: true,
        error: "Select a valid Subcategory",
        formulae: [`Subcategories!$A$1:$A$${subcategories.rows.length}`],
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
