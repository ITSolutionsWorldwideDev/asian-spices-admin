// app/api/products/import/confirm/route.ts

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/core/db";
import { requirePlatformAdmin } from "@/lib/auth/guards";

type ImportRow = {
  row: number;
  data: any;
  isValid: boolean;
  errors: string[];
};

type ProductSkuRow = { sku: string };

const DEFAULT_STORE_ID = "afef3fd5-c31a-440a-ae56-99eca0b24359";

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export async function POST(req: NextRequest) {
  await requirePlatformAdmin();

  const client = await pool.connect();

  try {
    const body: { rows: ImportRow[] } = await req.json();

    if (!body?.rows?.length) {
      return NextResponse.json({ error: "No rows provided" }, { status: 400 });
    }

    await client.query("BEGIN");

    let inserted = 0;
    let skipped = 0;
    const errors: any[] = [];
    const insertedProductIds: number[] = [];

    /* ---------------- EXISTING SKU CACHE ---------------- */

    const existing = await client.query<ProductSkuRow>(
      `SELECT sku FROM store_products`,
    );

    const skuSet = new Set(existing.rows.map((r: ProductSkuRow) => r.sku));

    /* ---------------- INSERT LOOP ---------------- */

    for (const r of body.rows) {
      try {
        if (!r.isValid) {
          skipped++;
          continue;
        }

        const row = r.data;

        /* ---------------- DUPLICATE CHECK (SERVER SAFETY) ---------------- */

        if (skuSet.has(row.SKU)) {
          skipped++;
          continue;
        }

        skuSet.add(row.SKU);

        /* ---------------- RESOLVE RELATIONSHIP ID ENTITIES ----------------
           Looked up by name only (no status filter) so a category/brand
           that's selectable on the manual Add Product form is always
           importable here too. */

        let categoryId: number | null = null;
        let subcategoryId: number | null = null;
        let brandId: number | null = null;

        if (row.Category) {
          const cRes = await client.query<{ id: number }>(
            `SELECT id FROM store_categories WHERE LOWER(TRIM(name)) = LOWER(TRIM($1)) LIMIT 1`,
            [row.Category],
          );
          if (cRes.rows.length) categoryId = cRes.rows[0].id;
        }

        if (row.Subcategory) {
          const scRes = await client.query<{ id: number }>(
            `SELECT id FROM store_subcategories WHERE LOWER(TRIM(name)) = LOWER(TRIM($1)) LIMIT 1`,
            [row.Subcategory],
          );
          if (scRes.rows.length) subcategoryId = scRes.rows[0].id;
        }

        if (row.Brand) {
          const bRes = await client.query<{ brand_id: number }>(
            `SELECT brand_id FROM store_brands WHERE LOWER(TRIM(name)) = LOWER(TRIM($1)) LIMIT 1`,
            [row.Brand],
          );
          if (bRes.rows.length) brandId = bRes.rows[0].brand_id;
        }

        const slug = row.Slug?.trim() || slugify(row.Name);

        /* ---------------- INSERT PRODUCT ---------------- */

        const productRes = await client.query<{ id: number }>(
          `
          INSERT INTO store_products (
            name,
            slug,
            sku,
            item_code,
            category_id,
            subcategory_id,
            brand_id,
            description,
            health_benefits,
            base_price,
            quantity,
            discount_type,
            discount_value,
            status
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
          RETURNING id
          `,
          [
            row.Name,
            slug,
            row.SKU,
            row["Item Code"] || null,
            categoryId,
            subcategoryId,
            brandId,
            row.Description || null,
            row["Health Benefits"] || null,
            Number(row["Base Price"]),
            Number(row.Quantity),
            row["Discount Type"] || null,
            row["Discount Value"] ? Number(row["Discount Value"]) : null,
            row.Status === "Inactive" ? 0 : 1,
          ],
        );

        const productId = productRes.rows[0].id;
        insertedProductIds.push(productId);

        /* ---------------- COUNTRIES (optional comma separated) ---------------- */

        if (row["Available Countries"]) {
          const countries = row["Available Countries"]
            .split(",")
            .map((c: string) => c.trim())
            .filter(Boolean);

          for (const countryName of countries) {
            const cRes = await client.query<{ country_id: number }>(
              `SELECT country_id FROM countries WHERE LOWER(TRIM(country_name)) = LOWER(TRIM($1))`,
              [countryName],
            );

            if (cRes.rows.length) {
              await client.query(
                `
                INSERT INTO store_product_countries (
                  product_id,
                  country_id
                )
                VALUES ($1,$2)
                ON CONFLICT DO NOTHING
                `,
                [productId, cRes.rows[0].country_id],
              );
            }
          }
        }

        /* ---------------- IMAGES (comma separated URLs) ----------------
           Inserted straight from the row instead of fuzzy-matching the
           media library by product name, which could attach the wrong
           image or crash on a non-numeric url in an unrelated row. */

        if (row.Images) {
          const imageUrls = String(row.Images)
            .split(",")
            .map((u: string) => u.trim())
            .filter(Boolean);

          for (let idx = 0; idx < imageUrls.length; idx++) {
            await client.query(
              `
              INSERT INTO store_product_images (
                product_id,
                url,
                alt_text,
                is_primary
              )
              VALUES ($1, $2, $3, $4)
              `,
              [productId, imageUrls[idx], row.Name, idx === 0],
            );
          }
        }

        /* ---------------- B2B PRICES ---------------- */

        if (row["B2B Prices"]) {
          try {
            const tiers = JSON.parse(row["B2B Prices"]) as Array<{
              min_quantity: number;
              price: number;
            }>;

            for (const t of tiers) {
              await client.query(
                `
                INSERT INTO store_product_prices (
                  product_id,
                  customer_type,
                  min_quantity,
                  price
                )
                VALUES ($1,'B2B',$2,$3)
                `,
                [productId, t.min_quantity, t.price],
              );
            }
          } catch {
            // ignore invalid JSON (already validated earlier)
          }
        }

        inserted++;
      } catch (err: any) {
        errors.push({
          row: r.row,
          error: err.message,
        });
        skipped++;
      }
    }

    /* ---------------- DEFAULT STORE ASSIGNMENT ----------------
       Scoped to just-inserted products only — this used to run against
       every row in store_products, resetting price/quantity for the
       entire catalog on every import. */

    if (insertedProductIds.length > 0) {
      await client.query(
        `
        INSERT INTO store_product_catalog (
          store_id,
          product_id,
          price,
          quantity,
          status
        )
        SELECT
          $2 AS store_id,
          p.id,
          COALESCE(p.base_price, 0) AS price,
          p.quantity,
          1 AS status
        FROM store_products p
        WHERE p.id = ANY($1)
        ON CONFLICT (store_id, product_id)
        DO UPDATE SET
          price = EXCLUDED.price,
          quantity = EXCLUDED.quantity,
          updated_at = now()
        `,
        [insertedProductIds, DEFAULT_STORE_ID],
      );
    }

    await client.query("COMMIT");

    return NextResponse.json({
      success: true,
      inserted,
      skipped,
      failed: errors.length,
      errors,
    });
  } catch (err: any) {
    await client.query("ROLLBACK");

    return NextResponse.json(
      {
        error: "Import failed",
        detail: err.message,
      },
      { status: 500 },
    );
  } finally {
    client.release();
  }
}
