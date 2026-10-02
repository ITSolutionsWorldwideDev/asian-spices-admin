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
import { slugify } from "@/lib/utils/slugify";
import { normalizeExcelRow } from "@/lib/products/excelRow";
import {
  decideImportAction,
  findExistingProduct,
  productIdentityKey,
  resolveImportValues,
  type ExistingProduct,
} from "@/lib/products/importUpsert";

type ImportRow = {
  row: number;
  data: any;
  isValid: boolean;
  errors: string[];
};

const DEFAULT_STORE_ID = "afef3fd5-c31a-440a-ae56-99eca0b24359";

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
    let updated = 0;
    let skipped = 0;
    const errors: any[] = [];
    const touchedProductIds: number[] = [];

    const existingRes = await client.query<ExistingProduct>(`
      SELECT
        p.id,
        p.sku,
        p.item_code,
        p.name,
        p.slug,
        p.description,
        p.health_benefits,
        p.base_price,
        p.weight,
        p.quantity,
        p.discount_type,
        p.discount_value,
        p.status,
        p.country_of_origin,
        c.name AS category,
        sc.name AS subcategory,
        b.name AS brand,
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
    `);

    const bySku = new Map<string, ExistingProduct>();
    const byItemCode = new Map<string, ExistingProduct>();
    const byIdentity = new Map<string, ExistingProduct>();

    for (const product of existingRes.rows) {
      if (!Array.isArray(product.b2b_prices)) product.b2b_prices = [];
      const skuKey = normalizeProductCode(product.sku).toLowerCase();
      const itemKey = normalizeProductCode(product.item_code).toLowerCase();
      if (skuKey) bySku.set(skuKey, product);
      if (itemKey) byItemCode.set(itemKey, product);
      const identityKey = productIdentityKey(
        product.name,
        product.brand,
        product.weight,
      );
      if (identityKey !== "||") byIdentity.set(identityKey, product);
    }

    const maxSkuSeq = await getMaxNumericSkuSequence(client);
    const skuAllocator = createSequentialSkuAllocator(maxSkuSeq);
    const maxItemCodeSeq = await getMaxNumericItemCodeSequence(client);
    const itemCodeAllocator = createSequentialItemCodeAllocator(maxItemCodeSeq);
    const categoryCache = new Map<string, number>();
    const subcategoryCache = new Map<string, number>();
    const brandCache = new Map<string, number>();

    for (const r of body.rows) {
      try {
        if (!r.isValid) {
          skipped++;
          continue;
        }

        const row = normalizeExcelRow(r.data ?? {});
        const { existing, conflict } = findExistingProduct(row, byIdentity);

        if (conflict) {
          errors.push({ row: r.row, error: conflict });
          skipped++;
          continue;
        }

        const providedSku = normalizeProductCode(row.SKU);
        const providedItemCode = normalizeProductCode(row["Item Code"]);

        let sku = providedSku;
        let itemCode = providedItemCode;

        if (existing) {
          sku = providedSku || normalizeProductCode(existing.sku);
          itemCode =
            providedItemCode || normalizeProductCode(existing.item_code);
        } else {
          sku = providedSku || skuAllocator.next();
          itemCode = providedItemCode || itemCodeAllocator.next();
        }

        const values = resolveImportValues(row, { sku, itemCode });
        const action = decideImportAction(existing, values);

        if (action === "skip") {
          skipped++;
          continue;
        }

        let categoryId: number | null = null;
        let subcategoryId: number | null = null;
        let brandId: number | null = null;

        if (values.category) {
          categoryId = await resolveOrCreateCategory(
            client,
            values.category,
            categoryCache,
          );
        }

        if (values.subcategory && categoryId) {
          subcategoryId = await resolveOrCreateSubcategory(
            client,
            values.subcategory,
            categoryId,
            subcategoryCache,
          );
        }

        if (values.brand) {
          brandId = await resolveOrCreateBrand(
            client,
            values.brand,
            brandCache,
          );
        }

        await client.query("SAVEPOINT product_row");

        try {
          const originCountryId = values.countryOfOrigin
            ? await resolveCountryId(client, values.countryOfOrigin)
            : null;

          if (action === "update" && existing) {
            await client.query(
              `
              UPDATE store_products SET
                name = $1,
                slug = $2,
                sku = $3,
                item_code = $4,
                category_id = $5,
                subcategory_id = $6,
                brand_id = $7,
                country_of_origin = $8,
                country_id = $9,
                description = $10,
                health_benefits = $11,
                base_price = $12,
                weight = $13,
                quantity = $14,
                discount_type = $15,
                discount_value = $16,
                status = $17,
                updated_at = NOW()
              WHERE id = $18
              `,
              [
                values.name,
                values.slug,
                values.sku,
                values.itemCode,
                categoryId,
                subcategoryId,
                brandId,
                values.countryOfOrigin,
                originCountryId,
                values.description,
                values.healthBenefits,
                values.basePrice,
                values.weight,
                values.quantity,
                values.discountType,
                values.discountValue,
                values.status,
                existing.id,
              ],
            );

            if (values.b2bPricesProvided) {
              await client.query(
                `DELETE FROM store_product_prices
                 WHERE product_id = $1 AND customer_type = 'B2B'`,
                [existing.id],
              );

              for (const t of values.b2bPrices ?? []) {
                await client.query(
                  `
                  INSERT INTO store_product_prices (
                    product_id, customer_type, min_quantity, price
                  )
                  VALUES ($1, 'B2B', $2, $3)
                  `,
                  [existing.id, t.min_quantity, t.price],
                );
              }
            }

            // Refresh maps after SKU / item code changes
            const oldSku = normalizeProductCode(existing.sku).toLowerCase();
            const oldItem = normalizeProductCode(existing.item_code).toLowerCase();
            if (oldSku) bySku.delete(oldSku);
            if (oldItem) byItemCode.delete(oldItem);

            const updatedProduct: ExistingProduct = {
              ...existing,
              ...{
                name: values.name,
                slug: values.slug,
                sku: values.sku,
                item_code: values.itemCode,
                category: values.category,
                subcategory: values.subcategory,
                brand: values.brand,
                country_of_origin: values.countryOfOrigin,
                description: values.description,
                health_benefits: values.healthBenefits,
                base_price: values.basePrice,
                weight: values.weight,
                quantity: values.quantity,
                discount_type: values.discountType,
                discount_value: values.discountValue,
                status: values.status,
                b2b_prices: values.b2bPricesProvided
                  ? values.b2bPrices
                  : existing.b2b_prices,
              },
            };
            bySku.set(values.sku.toLowerCase(), updatedProduct);
            byItemCode.set(values.itemCode.toLowerCase(), updatedProduct);
            byIdentity.set(
              productIdentityKey(values.name, values.brand, values.weight),
              updatedProduct,
            );

            touchedProductIds.push(existing.id);
            updated++;
          } else {
            const productRes = await client.query<{ id: number }>(
              `
              INSERT INTO store_products (
                name, slug, sku, item_code,
                category_id, subcategory_id, brand_id,
                country_of_origin, country_id,
                description, health_benefits,
                base_price, weight, quantity,
                discount_type, discount_value, status
              )
              VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
              RETURNING id
              `,
              [
                values.name,
                values.slug,
                values.sku,
                values.itemCode,
                categoryId,
                subcategoryId,
                brandId,
                values.countryOfOrigin,
                originCountryId,
                values.description,
                values.healthBenefits,
                values.basePrice,
                values.weight,
                values.quantity,
                values.discountType,
                values.discountValue,
                values.status,
              ],
            );

            const productId = productRes.rows[0].id;

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

            if (values.b2bPricesProvided && values.b2bPrices?.length) {
              for (const t of values.b2bPrices) {
                await client.query(
                  `
                  INSERT INTO store_product_prices (
                    product_id, customer_type, min_quantity, price
                  )
                  VALUES ($1, 'B2B', $2, $3)
                  `,
                  [productId, t.min_quantity, t.price],
                );
              }
            }

            const created: ExistingProduct = {
              id: productId,
              sku: values.sku,
              item_code: values.itemCode,
              name: values.name,
              slug: values.slug,
              description: values.description,
              health_benefits: values.healthBenefits,
              base_price: values.basePrice,
              weight: values.weight,
              quantity: values.quantity,
              discount_type: values.discountType,
              discount_value: values.discountValue,
              status: values.status,
              country_of_origin: values.countryOfOrigin,
              category: values.category,
              subcategory: values.subcategory,
              brand: values.brand,
              b2b_prices: values.b2bPrices,
            };
            bySku.set(values.sku.toLowerCase(), created);
            byItemCode.set(values.itemCode.toLowerCase(), created);
            byIdentity.set(
              productIdentityKey(values.name, values.brand, values.weight),
              created,
            );

            touchedProductIds.push(productId);
            inserted++;
          }

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

    if (touchedProductIds.length > 0) {
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
        [touchedProductIds, DEFAULT_STORE_ID],
      );
    }

    await client.query("COMMIT");

    return NextResponse.json({
      success: true,
      inserted,
      updated,
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

async function resolveCountryId(
  client: PoolClient,
  name: string,
): Promise<number | null> {
  const trimmed = normalizeName(name);
  if (!trimmed) return null;

  const res = await client.query<{ country_id: number }>(
    `
    SELECT country_id
    FROM countries
    WHERE TRIM(country_name) ILIKE $1
    LIMIT 1
    `,
    [trimmed],
  );

  return res.rows[0]?.country_id ?? null;
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
