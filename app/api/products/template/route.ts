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

function safeName(name: string) {
  return name.replace(/[^a-zA-Z0-9]/g, "_").replace(/_+/g, "_");
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
      "Required — depends on Category",
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

    /* ---------------- SUBCATEGORY (DEPENDENT) ---------------- */

    const subSheet = workbook.addWorksheet("Subcategories");

    // Group subcategories by category
    const grouped: Record<string, string[]> = {};

    const categoryMap = new Map<string, string>(
      categories.rows.map((c) => [String(c.id), c.name]),
    );

    subcategories.rows.forEach((r) => {
      const cat = categoryMap.get(String(r.category_id));
      if (!cat) return;

      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(r.name);
    });

    // Create named ranges per category
    let colIndex = 1;

    Object.entries(grouped).forEach(([category, subs]) => {
      subs.forEach((s, i) => {
        subSheet.getCell(i + 1, colIndex).value = s;
      });

      const colLetter = subSheet.getColumn(colIndex).letter;
      const safe = safeName(category);

      workbook.definedNames.add(
        safe,
        `Subcategories!$${colLetter}$1:$${colLetter}$${subs.length}`,
      );

      colIndex++;
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

      // Dependent dropdown: Subcategory options depend on the Category
      // chosen in the same row (named range per category, see above).
      sheet.getCell(`F${i}`).dataValidation = {
        type: "list",
        allowBlank: true,
        showErrorMessage: true,
        error: "Select a valid Subcategory",
        formulae: [
          `INDIRECT(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE($E${i}," ","_"),"-","_"),"&","_"))`,
        ],
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
