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
    /* ---------------- FETCH DATA ---------------- */

    // const [categories, subcategories, brands, countries] = await Promise.all([
    //   client.query(`SELECT id, name FROM store_categories ORDER BY name`),
    //   client.query(`SELECT id, name, category_id FROM store_subcategories ORDER BY name`),
    //   client.query(`SELECT id, name FROM store_brands ORDER BY name`),
    //   client.query(`SELECT id, name FROM countries ORDER BY name`)
    // ]);

    const [categories, subcategories, brands, countries] = await Promise.all([
      client.query<QueryRowItem>(`
        SELECT id, name 
        FROM store_categories 
        WHERE status = 1
        ORDER BY name
    `),

      client.query<SubcategoryRowItem>(`
        SELECT id, name, category_id 
        FROM store_subcategories 
        WHERE status = 1
        ORDER BY name
    `),

      client.query<QueryRowItem>(`
        SELECT brand_id AS id, name 
        FROM store_brands 
        WHERE status = true
        ORDER BY name
    `),

      client.query<QueryRowItem>(`
        SELECT country_id AS id, country_name AS name 
        FROM countries
        ORDER BY country_name
    `),
    ]);

    const workbook = new ExcelJS.Workbook();

    // console.log("Categories:", categories.rows.length);
    // console.log("Subcategories:", subcategories.rows.length);
    // console.log("Brands:", brands.rows.length);
    // console.log("Countries:", countries.rows.length);

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

    sheet.columns?.forEach((col) => {
      col.width = 22;
    });

    sheet.views = [{ state: "frozen", ySplit: 1 }];

    sheet.getRow(1).eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFEFEFEF" },
      };
    });

    sheet.addRow(headers);

    sheet.addRow([
      "Sample Product",
      "sample-product",
      "SKU001",
      "ITM001",
      "Electronics",
      "Mobiles",
      "Apple",
      "USA",
      "USA,India",
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
      "👉 Select from dropdowns",
      "",
      "",
      "",
      "Click cell ▼",
      "Depends on Category",
      "Dropdown",
      "Dropdown",
      "Comma separated",
      "",
      "",
      "",
      "",
      "PERCENT/FLAT",
      "",
      "Active/Inactive",
      "Comma URLs",
      "JSON format",
    ]);

    sheet.getRow(1).font = { bold: true };

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

    // const catSheet = workbook.addWorksheet("Categories");

    // categories.rows.forEach((r: { name: string }, i) => {
    //   catSheet.getCell(`A${i + 1}`).value = r.name;
    // });

    // const brandSheet = workbook.addWorksheet("Brands");

    // brands.rows.forEach((r: { name: string }, i) => {
    //   brandSheet.getCell(`A${i + 1}`).value = r.name;
    // });

    // const countrySheet = workbook.addWorksheet("Countries");

    // countries.rows.forEach((r: { name: string }, i) => {
    //   countrySheet.getCell(`A${i + 1}`).value = r.name;
    // });

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

    // const subSheet = workbook.addWorksheet("Subcategories");

    // const grouped: Record<string, string[]> = {};

    // const categoryMap = new Map<string, string>(
    //   categories.rows.map((c: { id: number | string; name: string }) => [String(c.id), c.name]),
    // );


    // subcategories.rows.forEach((r: { category_id: number | string; name: string }) => {
    //   const cat = categoryMap.get(String(r.category_id));
    //   if (!cat) return;

    //   if (!grouped[cat]) grouped[cat] = [];
    //   grouped[cat].push(r.name);
    // });

    // Create named ranges per category
    let colIndex = 1;

    Object.entries(grouped).forEach(([category, subs]) => {
      subs.forEach((s, i) => {
        subSheet.getCell(i + 1, colIndex).value = s;
      });

      const colLetter = subSheet.getColumn(colIndex).letter;

      //   workbook.definedNames.add(
      //     category.replace(/\s/g, "_"),
      //     `Subcategories!$${colLetter}$1:$${colLetter}$${subs.length}`,
      //   );
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
      //   sheet.getCell(`E${i}`).dataValidation = {
      //     type: "list",
      //     formulae: [`Categories!$A$1:$A$${categories.rows.length}`],
      //   };
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

      // 🔥 DEPENDENT DROPDOWN
      sheet.getCell(`F${i}`).dataValidation = {
        type: "list",
        allowBlank: true,
        showErrorMessage: true,
        error: "Select a valid Subcategory",
        formulae: [
          `INDIRECT(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE($E${i}," ","_"),"-","_"),"&","_"))`,
        ],
      };
      //   sheet.getCell(`F${i}`).dataValidation = {
      //     type: "list",
      //     formulae: [`INDIRECT(SUBSTITUTE($E${i}," ","_"))`],
      //   };
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
