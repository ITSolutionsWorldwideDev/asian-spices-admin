// app/api/products/import/confirm/route.ts

import { NextRequest, NextResponse } from "next/server";
import type { PoolClient } from "pg";
import { pool } from "@/core/db";
import { requirePlatformAdmin } from "@/lib/auth/guards";
import { normalizeProductCode } from "@/lib/products/uniqueCodes";
import {
  createSequentialSkuAllocator,
  getMaxNumericSkuSequence,
} from "@/lib/products/sku";
import {
  createSequentialItemCodeAllocator,
  getMaxNumericItemCodeSequence,
} from "@/lib/products/itemCode";
import { productSlug, slugify } from "@/lib/utils/slugify";
import { excelWeight, normalizeExcelRow } from "@/lib/products/excelRow";

type ImportRow = {
  row: number;
  data: any;
  isValid: boolean;
  errors: string[];
};

type ProductCodeRow = { sku: string; item_code: string };

const DEFAULT_STORE_ID = "afef3fd5-c31a-440a-ae56-99eca0b24359";
const DEFAULT_QUANTITY = 9999;

const EU_COUNTRY_CODES = [
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR",
  "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK",
  "SI", "ES", "SE",
];

function normalizeName(name: string) {
  return String(name ?? "").trim();
}

function nameKey(name: string) {
  return normalizeName(name).toLowerCase();
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

    /* ---------------- EXISTING SKU / ITEM CODE CACHE ---------------- */

    const existing = await client.query<ProductCodeRow>(
      `SELECT sku, item_code FROM store_products`,
    );

    const itemCodeSet = new Set(
      existing.rows
        .map((r: ProductCodeRow) =>
          normalizeProductCode(r.item_code).toLowerCase(),
        )
        .filter(Boolean),
    );
    const maxSkuSeq = await getMaxNumericSkuSequence(client);
    const skuAllocator = createSequentialSkuAllocator(maxSkuSeq);
    const maxItemCodeSeq = await getMaxNumericItemCodeSequence(client);
    const itemCodeAllocator = createSequentialItemCodeAllocator(maxItemCodeSeq);
    const categoryCache = new Map<string, number>();
    const subcategoryCache = new Map<string, number>();
    const brandCache = new Map<string, number>();

    /* ---------------- INSERT LOOP ---------------- */

    for (const r of body.rows) {
      try {
        if (!r.isValid) {
          skipped++;
          continue;
        }

        const row = normalizeExcelRow(r.data ?? {});

        const providedSku = normalizeProductCode(row.SKU);
        const sku = providedSku || skuAllocator.next();
        const providedItemCode = normalizeProductCode(row["Item Code"]);
        const itemCode = providedItemCode || itemCodeAllocator.next();
        const itemCodeKey = itemCode.toLowerCase();

        /* ---------------- DUPLICATE CHECK (SERVER SAFETY) ---------------- */

        if (itemCodeSet.has(itemCodeKey)) {
          skipped++;
          continue;
        }

        itemCodeSet.add(itemCodeKey);

        /* ---------------- RESOLVE RELATIONSHIP ID ENTITIES ----------------
           Category, subcategory, and brand are created automatically if missing. */

        let categoryId: number | null = null;
        let subcategoryId: number | null = null;
        let brandId: number | null = null;

        if (row.Category) {
          categoryId = await resolveOrCreateCategory(
            client,
            String(row.Category),
            categoryCache,
          );
        }

        if (row.Subcategory && categoryId) {
          subcategoryId = await resolveOrCreateSubcategory(
            client,
            String(row.Subcategory),
            categoryId,
            subcategoryCache,
          );
        }

        if (row.Brand) {
          brandId = await resolveOrCreateBrand(
            client,
            String(row.Brand),
            brandCache,
          );
        }

        const weight = excelWeight(row);
        const slug = productSlug(
          String(row.Slug ?? "").trim() || String(row.Name ?? ""),
          weight,
        );

        await client.query("SAVEPOINT product_row");

        try {
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
            weight,
            quantity,
            discount_type,
            discount_value,
            status
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
          RETURNING id
          `,
            [
              row.Name,
              slug,
              sku,
              itemCode,
              categoryId,
              subcategoryId,
              brandId,
              row.Description || null,
              row["Health Benefits"] || null,
              Number(row["Base Price"]),
              weight,
              row.Quantity === undefined || row.Quantity === ""
                ? DEFAULT_QUANTITY
                : Number(row.Quantity),
              row["Discount Type"] || null,
              row["Discount Value"] ? Number(row["Discount Value"]) : null,
              row.Status === "Inactive" ? 0 : 1,
            ],
          );

          const productId = productRes.rows[0].id;

          /* ---------------- EU AVAILABILITY (all EU countries) ---------------- */

          await client.query(
            `
          INSERT INTO store_product_countries (product_id, country_id)
          SELECT $1, country_id
          FROM countries
          WHERE UPPER(country_code) = ANY($2)
          ON CONFLICT DO NOTHING
          `,
            [productId, EU_COUNTRY_CODES],
          );

          /* ---------------- B2B PRICES ---------------- */

          if (row["B2B Prices"]) {
            try {
              const tiers = JSON.parse(String(row["B2B Prices"])) as Array<{
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

          insertedProductIds.push(productId);
          inserted++;
          await client.query("RELEASE SAVEPOINT product_row");
        } catch (rowErr: any) {
          await client.query("ROLLBACK TO SAVEPOINT product_row");
          throw rowErr;
        }
      } catch (err: any) {
        errors.push({
          row: r.row,
          error:
            err.code === "23505"
              ? "SKU or item code already exists"
              : err.message,
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

async function resolveOrCreateCategory(
  client: PoolClient,
  name: string,
  cache: Map<string, number>,
): Promise<number> {
  const trimmed = normalizeName(name);
  const key = nameKey(trimmed);

  const cached = cache.get(key);
  if (cached) return cached;

  const existing = await client.query<{ id: number }>(
    `SELECT id FROM store_categories WHERE TRIM(name) ILIKE $1 LIMIT 1`,
    [trimmed],
  );

  if (existing.rows.length) {
    cache.set(key, existing.rows[0].id);
    return existing.rows[0].id;
  }

  const insert = await client.query<{ id: number }>(
    `
    INSERT INTO store_categories (name, slug, status)
    VALUES ($1, $2, 1)
    RETURNING id
    `,
    [trimmed, slugify(trimmed)],
  );

  const id = insert.rows[0].id;
  cache.set(key, id);
  return id;
}

async function resolveOrCreateSubcategory(
  client: PoolClient,
  name: string,
  categoryId: number,
  cache: Map<string, number>,
): Promise<number> {
  const trimmed = normalizeName(name);
  const key = `${categoryId}:${nameKey(trimmed)}`;

  const cached = cache.get(key);
  if (cached) return cached;

  const existing = await client.query<{ id: number }>(
    `
    SELECT id FROM store_subcategories
    WHERE category_id = $1 AND TRIM(name) ILIKE $2
    LIMIT 1
    `,
    [categoryId, trimmed],
  );

  if (existing.rows.length) {
    cache.set(key, existing.rows[0].id);
    return existing.rows[0].id;
  }

  const insert = await client.query<{ id: number }>(
    `
    INSERT INTO store_subcategories (category_id, name, slug, status, created_at, updated_at)
    VALUES ($1, $2, $3, 1, NOW(), NOW())
    RETURNING id
    `,
    [categoryId, trimmed, slugify(trimmed)],
  );

  const id = insert.rows[0].id;
  cache.set(key, id);
  return id;
}

async function resolveOrCreateBrand(
  client: PoolClient,
  name: string,
  cache: Map<string, number>,
): Promise<number> {
  const trimmed = normalizeName(name);
  const key = nameKey(trimmed);

  const cached = cache.get(key);
  if (cached) return cached;

  const existing = await client.query<{ brand_id: number }>(
    `SELECT brand_id FROM store_brands WHERE TRIM(name) ILIKE $1 LIMIT 1`,
    [trimmed],
  );

  if (existing.rows.length) {
    cache.set(key, existing.rows[0].brand_id);
    return existing.rows[0].brand_id;
  }

  const insert = await client.query<{ brand_id: number }>(
    `
    INSERT INTO store_brands (name, slug, description, logo_url, status, created_at, updated_at)
    VALUES ($1, $2, NULL, NULL, true, NOW(), NOW())
    RETURNING brand_id
    `,
    [trimmed, slugify(trimmed)],
  );

  const id = insert.rows[0].brand_id;
  cache.set(key, id);
  return id;
}
