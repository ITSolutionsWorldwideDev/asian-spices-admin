// apps/admin/app/api/products/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getCurrentStoreAPI, requireStorePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { requirePlatformAdmin } from "@/lib/auth/guards";
import { pool } from "@/core/db";

/* ------------------ GET (Single Product) ------------------ */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  // await requireStorePermission(PERMISSIONS.MANAGE_PRODUCTS);
  // const store = await getCurrentStoreAPI(req);
  await requirePlatformAdmin();

  const { id } = await params;

  const product = await pool.query(
    `
    SELECT * FROM store_products
    WHERE id = $1
    `,
    [id],
  );

  if (!product.rows.length)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const countries = await pool.query(
    `SELECT country_id FROM store_product_countries WHERE product_id = $1`,
    [id],
  );

  // const country_ids = countries.rows.map((c) => c.country_id);

  const country_ids = countries.rows.map(
    (c: { country_id: string | number }) => c.country_id,
  );

  const prices = await pool.query(
    `SELECT * FROM store_product_prices WHERE product_id=$1`,
    [id],
  );

  const images = await pool.query(
    `SELECT * FROM store_product_images WHERE product_id=$1`,
    [id],
  );

  return NextResponse.json({
    ...product.rows[0],
    prices: prices.rows,
    images: images.rows,
    country_ids: country_ids,
  });
}

/* ------------------ PUT (Update Product) ------------------ */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  // await requireStorePermission(PERMISSIONS.MANAGE_PRODUCTS);
  // const store = await getCurrentStoreAPI(req);
  await requirePlatformAdmin();

  const client = await pool.connect();
  const { id } = await params;

  try {
    await client.query("BEGIN");

    const body = await req.json();

    const product = await client.query(
      `
      UPDATE store_products SET
        name=$1,
        slug=$2,
        sku=$3,
        item_code=$4,
        category_id=$5,
        subcategory_id=$6,
        brand_id=$7,
        description=$8,
        price=$9,
        quantity=$10,
        discount_type=$11,
        discount_value=$12,
        status=$13,
        health_benefits=$14,
        updated_at=NOW()
      WHERE id=$15
      RETURNING *
      `,
      [
        body.name,
        body.slug,
        body.sku,
        body.item_code,
        body.category_id,
        body.subcategory_id,
        body.brand_id,
        body.description,
        body.price,
        999999999, //body.quantity,
        body.discount_type,
        body.discount_value,
        body.status ?? 1,
        body.health_benefits,
        id,
      ],
    );

    /* ---------------- Countries (MULTI) ---------------- */

    // delete old
    await client.query(
      `DELETE FROM store_product_countries WHERE product_id = $1`,
      [id],
    );

    // insert new
    if (body.country_ids?.length) {
      const values = body.country_ids
        .map((_: any, i: number) => `($1, $${i + 2})`)
        .join(",");

      await client.query(
        `INSERT INTO store_product_countries (product_id, country_id)
         VALUES ${values}`,
        [id, ...body.country_ids],
      );
    }

    /* Remove old prices */
    await client.query(`DELETE FROM store_product_prices WHERE product_id=$1`, [
      id,
    ]);

    /* Reinsert B2C */
    await client.query(
      `
      INSERT INTO store_product_prices
      (product_id, customer_type, min_quantity, price)
      VALUES ($1,'B2C',1,$2)
      `,
      [id, body.price],
    );

    /* Reinsert B2B */
    if (body.b2b_prices?.length) {
      for (const tier of body.b2b_prices) {
        await client.query(
          `
          INSERT INTO store_product_prices
          (product_id, customer_type, min_quantity, price)
          VALUES ($1,'B2B',$2,$3)
          `,
          [id, tier.min_quantity, tier.price],
        );
      }
    }

    await client.query("COMMIT");

    return NextResponse.json(product.rows[0], { status: 201 });

    // return NextResponse.json(product.rows[0],{ success: true });
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  // await requireStorePermission(PERMISSIONS.MANAGE_PRODUCTS);

  const { id } = await params;

  console.log("DELETE id ===== ", id);

  await requirePlatformAdmin();

  const result = await pool.query("DELETE FROM products WHERE id=$1", [id]);

  console.log("result ===== ", result);

  return NextResponse.json({ success: true });
}
