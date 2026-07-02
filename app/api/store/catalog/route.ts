// app/api/store/catalog/route.ts

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/core/db";
import { getCurrentStoreAPI } from "@/lib/auth/guards";

export async function GET(req: NextRequest) {
  const store = await getCurrentStoreAPI(req);
  const store_id = store.id;

  const { searchParams } = new URL(req.url);

  const page = Number(searchParams.get("page") || 1);
  const limit = 10;
  const offset = (page - 1) * limit;

  const search = searchParams.get("search");
  const category = searchParams.get("category");
  const subcategory = searchParams.get("subcategory");
  const brand = searchParams.get("brand");
  const country = searchParams.get("country");
  const status = searchParams.get("status");
  const sort = searchParams.get("sort");
  const assigned = searchParams.get("assigned");

  /* ---------------- BUILD WHERE (REUSABLE) ---------------- */

  const buildWhere = (startIndex: number) => {
    let where = `WHERE 1=1`;
    const values: any[] = [];
    let i = startIndex;

    if (search) {
      values.push(`%${search}%`);
      where += ` AND (p.name ILIKE $${i} OR p.sku ILIKE $${i})`;
      i++;
    }

    if (category) {
      values.push(category);
      where += ` AND p.category_id = $${i++}`;
    }

    if (subcategory) {
      values.push(subcategory);
      where += ` AND p.subcategory_id = $${i++}`;
    }

    if (brand) {
      values.push(brand);
      where += ` AND p.brand_id = $${i++}`;
    }

    if (country) {
      values.push(country);
      where += ` AND p.country_id = $${i++}`; // adjust if using pivot table
    }

    if (status !== null && status !== "") {
      values.push(Number(status));
      where += ` AND spc.status = $${i++}`;
    }

    if (assigned === "true") {
      where += ` AND spc.id IS NOT NULL`;
    } else if (assigned === "false") {
      where += ` AND spc.id IS NULL`;
    }

    return { where, values };
  };

  /* ---------------- MAIN QUERY ---------------- */

  const main = buildWhere(1);

  let orderBy = `ORDER BY p.created_at DESC`;

  if (sort === "name_asc") {
    orderBy = `ORDER BY p.name ASC`;
  } else if (sort === "name_desc") {
    orderBy = `ORDER BY p.name DESC`;
  } else if (sort === "price_asc") {
    orderBy = `ORDER BY COALESCE(spc.price, p.base_price) ASC`;
  } else if (sort === "price_desc") {
    orderBy = `ORDER BY COALESCE(spc.price, p.base_price) DESC`;
  }

  const result = await pool.query(
    `
    SELECT 
      p.id AS product_id,
      p.name,
      p.sku,
      c.name AS category,
      b.name AS brand,

      p.base_price AS base_price,
      spc.price AS store_price,

      COALESCE(spc.price, p.price) AS effective_price,

      spc.quantity,
      spc.status,

      CASE WHEN spc.id IS NOT NULL THEN true ELSE false END AS assigned

    FROM store_products p
    LEFT JOIN store_product_catalog spc
      ON spc.product_id = p.id AND spc.store_id = $${main.values.length + 1}
    LEFT JOIN store_categories c ON c.id = p.category_id
    LEFT JOIN store_brands b ON b.brand_id = p.brand_id

    ${main.where}
    ${orderBy}

    LIMIT ${limit} OFFSET ${offset}
    `,
    [...main.values, store_id],
  );

  /* ---------------- COUNT QUERY (FIXED) ---------------- */

  const countBuild = buildWhere(2); // shift index because $1 = store_id

  const count = await pool.query(
    `
    SELECT COUNT(*)
    FROM store_products p
    LEFT JOIN store_product_catalog spc
      ON spc.product_id = p.id AND spc.store_id = $1
    ${countBuild.where}
    `,
    [store_id, ...countBuild.values],
  );

  return NextResponse.json({
    items: result.rows,
    total: Number(count.rows[0].count),
  });
}
