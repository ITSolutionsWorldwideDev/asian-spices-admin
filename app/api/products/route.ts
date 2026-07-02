// app/api/products/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/lib/auth/guards";
import { pool } from "@/core/db";

/* ------------------ GET (List Products) ------------------ */

export async function GET(req: NextRequest) {
  await requirePlatformAdmin();

  const { searchParams } = new URL(req.url);

  const search = searchParams.get("search");
  const category = searchParams.get("category");
  const brand = searchParams.get("brand");
  const status = searchParams.get("status");
  const sort = searchParams.get("sort");

  const conditions: string[] = [];
  const values: any[] = [];

  /* ---------------- FILTERS ---------------- */

  if (search) {
    values.push(`%${search}%`);
    conditions.push(
      `(p.name ILIKE $${values.length} OR p.sku ILIKE $${values.length})`,
    );
  }

  if (category) {
    values.push(`%${category}%`);
    conditions.push(`c.name ILIKE $${values.length}`);
  }

  if (brand) {
    values.push(`%${brand}%`);
    conditions.push(`b.name ILIKE $${values.length}`);
  }

  if (status !== null && status !== "") {
    values.push(Number(status));
    conditions.push(`p.status = $${values.length}`);
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  /* ---------------- SORTING ---------------- */

  let orderBy = `ORDER BY p.created_at DESC`;

  if (sort === "price_asc") {
    orderBy = `ORDER BY p.base_price ASC`;
  } else if (sort === "price_desc") {
    orderBy = `ORDER BY p.base_price DESC`;
  } else if (sort === "newest") {
    orderBy = `ORDER BY p.created_at DESC`;
  }

  /* ---------------- QUERY ---------------- */

  const query = `
    SELECT 
      p.*,
      c.name AS category,
      sc.name AS subcategory,
      b.name AS brand,
      (
        SELECT price
        FROM store_product_prices spp
        WHERE spp.product_id = p.id
          AND spp.customer_type = 'B2C'
        ORDER BY min_quantity ASC
        LIMIT 1
      ) AS b2c_price
    FROM store_products p
    LEFT JOIN store_categories c ON c.id = p.category_id
    LEFT JOIN store_subcategories sc ON sc.id = p.subcategory_id
    LEFT JOIN store_brands b ON b.brand_id = p.brand_id
    ${whereClause}
    ${orderBy}
    `;

  // console.log("query product listing === ", query);
  // console.log("query product values === ", values);

  const result = await pool.query(query, values);
  return NextResponse.json({ items: result.rows });
}
/* ------------------ POST (Create Product) ------------------ */
export async function POST(req: NextRequest) {
  // await requireStorePermission(PERMISSIONS.MANAGE_PRODUCTS);
  // const store = await getCurrentStoreAPI(req);

  await requirePlatformAdmin();

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const body = await req.json();

    const product = await client.query(
      `
      INSERT INTO store_products
      (name, slug, sku, item_code,
       country_id, category_id, subcategory_id, brand_id,
       description, health_benefits, base_price, quantity, discount_type, discount_value, status)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
      RETURNING *
      `,
      [
        body.name,
        body.slug,
        body.sku,
        body.item_code,
        body.country_id,
        body.category_id,
        body.subcategory_id,
        body.brand_id,
        body.description,
        body.health_benefits,
        body.base_price,
        999999999, //body.quantity,
        body.discount_type,
        body.discount_value,
        body.status ?? 1,
      ],
    );

    const productId = product.rows[0].id;

    /* ---------------- Countries (MULTI) ---------------- */

    if (body.country_ids?.length) {
      const values = body.country_ids
        .map((_: any, i: number) => `($1, $${i + 2})`)
        .join(",");

      await client.query(
        `INSERT INTO store_product_countries (product_id, country_id)
         VALUES ${values}`,
        [productId, ...body.country_ids],
      );
    }

    /* ---------------- B2C Price ---------------- */
    await client.query(
      `
      INSERT INTO store_product_prices
      (product_id, customer_type, min_quantity, price)
      VALUES ($1,'B2C',1,$2)
      `,
      [productId, body.price],
    );

    /* ---------------- B2B Tier Prices ---------------- */
    if (body.b2b_prices?.length) {
      for (const tier of body.b2b_prices) {
        await client.query(
          `
          INSERT INTO store_product_prices
          (product_id, customer_type, min_quantity, price)
          VALUES ($1,'B2B',$2,$3)
          `,
          [productId, tier.min_quantity, tier.price],
        );
      }
    }

    await client.query("COMMIT");

    return NextResponse.json(product.rows[0], { status: 201 });
  } catch (e: any) {
    await client.query("ROLLBACK");
    return NextResponse.json(
      {
        error: "Failed to create product",
        detail: e.message,
        code: e.code,
      },
      { status: 500 },
    );
  } finally {
    client.release();
  }
}

/* ------------------------------------
   DELETE (remove Product)
------------------------------------ */
export async function DELETE(req: NextRequest) {
  await requirePlatformAdmin();

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  console.log("delete id === ", id);

  if (!id) {
    return NextResponse.json({ error: "Product ID required" }, { status: 400 });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await pool.query(
      "DELETE FROM store_order_items WHERE product_id =$1 RETURNING *",
      [id],
    );

    await pool.query(
      "DELETE FROM store_product_prices WHERE product_id =$1 RETURNING *",
      [id],
    );

    const result = await pool.query(
      "DELETE FROM store_products WHERE id=$1 RETURNING *",
      [id],
    );

    if (!result.rows.length) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    await client.query("COMMIT");

    return NextResponse.json({
      message: "Product deleted successfully",
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to delete Product" },
      { status: 500 },
    );
  }
}
