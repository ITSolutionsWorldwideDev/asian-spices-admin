// app/api/products/import/route.ts

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
  const errors: any[] = [];
  let inserted = 0;

  try {
    await client.query("BEGIN");

    for (const [index, row] of rows.entries()) {
      try {
        /* ---------- REQUIRED ---------- */
        if (!row.Name || !row.SKU || !row.Price) {
          throw new Error("Missing required fields");
        }

        /* ---------- LOOKUPS ---------- */
        const categoryId = await resolveId(
          client,
          "store_categories",
          "name",
          row.Category,
        );
        const subcategoryId = await resolveId(
          client,
          "store_subcategories",
          "name",
          row.Subcategory,
        );
        const brandId = await resolveId(
          client,
          "store_brands",
          "name",
          row.Brand,
        );

        const originCountryId = await resolveCountryId(
          client,
          row["Country of Origin"],
        );

        /* ---------- INSERT PRODUCT ---------- */
        const productRes = await client.query(
          `
          INSERT INTO store_products
          (name, slug, sku, item_code,
           category_id, subcategory_id, brand_id,
           country_of_origin, country_id,
           description, health_benefits,
           price, quantity,
           discount_type, discount_value, status)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
          RETURNING id
          `,
          [
            row.Name,
            row.Slug,
            row.SKU,
            row["Item Code"],
            categoryId,
            subcategoryId,
            brandId,
            row["Country of Origin"],
            originCountryId,
            row.Description || null,
            row["Health Benefits"] || null,
            row.Price,
            row.Quantity || 999999999,
            normalizeDiscount(row["Discount Type"]),
            row["Discount Value"] || null,
            parseStatus(row.Status),
          ],
        );

        const productId = productRes.rows[0].id;

        /* ---------- AVAILABLE COUNTRIES ---------- */
        if (row["Available Countries"]) {
          const names = row["Available Countries"].split(",");

          for (const name of names) {
            const cid = await resolveCountryId(client, name.trim());

            await client.query(
              `
              INSERT INTO store_product_countries (product_id, country_id)
              VALUES ($1,$2)
              ON CONFLICT DO NOTHING
              `,
              [productId, cid],
            );
          }
        }

        /* ---------- IMAGES ---------- */
        if (row.Images) {
          const images = row.Images.split(",");

          for (let i = 0; i < images.length; i++) {
            await client.query(
              `
              INSERT INTO store_product_images
              (product_id, url, is_primary, sort_order)
              VALUES ($1,$2,$3,$4)
              `,
              [productId, images[i].trim(), i === 0, i],
            );
          }
        }

        /* ---------- B2C PRICE ---------- */
        await client.query(
          `
          INSERT INTO store_product_prices
          (product_id, customer_type, min_quantity, price)
          VALUES ($1,'B2C',1,$2)
          `,
          [productId, row.Price],
        );

        /* ---------- B2B ---------- */
        if (row["B2B Prices"]) {
          const tiers = JSON.parse(row["B2B Prices"]);

          for (const t of tiers) {
            await client.query(
              `
              INSERT INTO store_product_prices
              VALUES (gen_random_uuid(), $1,'B2B',$2,$3)
              `,
              [productId, t.min_quantity, t.price],
            );
          }
        }

        inserted++;
      } catch (e: any) {
        errors.push({ row: index + 2, error: e.message });
      }
    }

    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }

  return NextResponse.json({
    inserted,
    failed: errors.length,
    errors,
  });
}

/* ---------- HELPERS ---------- */

async function resolveId(
  client: any,
  table: string,
  column: string,
  value?: string,
) {
  if (!value) return null;

  const res = await client.query(
    `SELECT id FROM ${table} WHERE ${column} ILIKE $1 LIMIT 1`,
    [value],
  );

  if (!res.rows.length) throw new Error(`${table} not found: ${value}`);

  return res.rows[0].id;
}

async function resolveCountryId(client: any, name?: string) {
  if (!name) return null;

  const res = await client.query(
    `SELECT id FROM countries WHERE name ILIKE $1 LIMIT 1`,
    [name],
  );

  if (!res.rows.length) throw new Error(`Country not found: ${name}`);

  return res.rows[0].id;
}

function normalizeDiscount(type?: string) {
  if (!type) return null;
  if (type.toLowerCase() === "%") return "PERCENT";
  if (type.toLowerCase() === "flat") return "FLAT";
  return type.toUpperCase();
}

function parseStatus(status?: string) {
  if (!status) return 1;
  return status.toLowerCase() === "active" ? 1 : 0;
}
