// app/api/store-assignments/route.ts

import { NextRequest, NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/lib/auth/guards";
import { pool } from "@/core/db";

/* ------------------ GET (List Product <-> Store Assignments) ------------------ */
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

  if (search) {
    values.push(`%${search}%`);
    conditions.push(`(p.name ILIKE $${values.length} OR p.sku ILIKE $${values.length})`);
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
    conditions.push(`spc.status = $${values.length}`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  let orderBy = `ORDER BY spc.updated_at DESC`;

  if (sort === "price_asc") orderBy = `ORDER BY spc.price ASC`;
  else if (sort === "price_desc") orderBy = `ORDER BY spc.price DESC`;
  else if (sort === "newest") orderBy = `ORDER BY spc.updated_at DESC`;

  const query = `
    SELECT
      spc.id,
      p.id AS product_id,
      p.name AS product_name,
      p.description,
      p.base_price,
      spc.price,
      p.discount_type,
      p.discount_value,
      s.id AS store_id,
      s.name AS store_name,
      spc.status
    FROM store_product_catalog spc
    JOIN store_products p ON p.id = spc.product_id
    JOIN stores s ON s.id = spc.store_id
    LEFT JOIN store_categories c ON c.id = p.category_id
    LEFT JOIN store_brands b ON b.brand_id = p.brand_id
    ${whereClause}
    ${orderBy}
  `;

  try {
    const result = await pool.query(query, values);
    return NextResponse.json({ items: result.rows });
  } catch (e: any) {
    console.error("[store-assignments GET]", e);
    return NextResponse.json(
      { error: "Failed to load store assignments", detail: e.message },
      { status: 500 },
    );
  }
}

/* ------------------ DELETE (Unassign product from store) ------------------ */
export async function DELETE(req: NextRequest) {
  await requirePlatformAdmin();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) return NextResponse.json({ error: "Assignment ID required" }, { status: 400 });

  const result = await pool.query(
    "DELETE FROM store_product_catalog WHERE id = $1 RETURNING *",
    [id],
  );

  if (!result.rows.length) {
    return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
  }

  return NextResponse.json({ message: "Product unassigned from store successfully" });
}
