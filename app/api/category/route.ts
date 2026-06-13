// /app/api/category/route.ts (GET)

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/core/db";
// import { getCurrentStoreAPI } from "@/lib/auth/guards";
import { requirePlatformAdmin } from "@/lib/auth/guards";

/* ------------------------------------
   Utils
------------------------------------ */
function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/* ------------------------------------
   GET (list or single category)
------------------------------------ */
export async function GET(req: NextRequest) {
  // const store = await getCurrentStoreAPI(req);
  // const storeId = store.id;
  // await requirePlatformAdmin();

  const { searchParams } = new URL(req.url);

  const id = searchParams.get("id");
  const page = Number(searchParams.get("page") || 1);
  const limit = Number(searchParams.get("limit") || 1000);
  const search = searchParams.get("search");
  const sort = searchParams.get("sort");

  const offset = (page - 1) * limit;

  try {
    /* -------- Single category -------- */
    if (id) {

      const result = await pool.query(
        `SELECT * FROM store_categories 
       WHERE id = $1`,
        [id],
      );

      // const result = await pool.query(
      //   `SELECT * FROM store_categories 
      //  WHERE id = $1 AND store_id = $2`,
      //   [id, storeId],
      // );

      if (!result.rows.length) {
        return NextResponse.json(
          { error: "Category not found" },
          { status: 404 },
        );
      }

      return NextResponse.json(result.rows[0]);
    }

    /* -------- List categories -------- */
    const where: string[] = [];
    const values: any[] = [];

    if (search) {
      values.push(`%${search.toLowerCase()}%`);
      where.push(`LOWER(name) LIKE $${values.length}`);
    }

    const whereClause = where.length ? ` AND ${where.join(" AND ")}` : "";

    let orderBy = "created_at DESC";
    if (sort === "nameAsc") orderBy = "category ASC";
    if (sort === "nameDesc") orderBy = "category DESC";
    if (sort === "dateAsc") orderBy = "created_at ASC";

    values.push(limit, offset);

    const dataQuery = `
      SELECT id, name, slug, status, created_at, updated_at
      FROM store_categories
      WHERE 1=1 ${whereClause}
      ORDER BY ${orderBy}
      LIMIT $${values.length - 1} OFFSET $${values.length}
    `;

    const countQuery = `
      SELECT COUNT(*)::int AS count
      FROM store_categories
      WHERE 1=1 ${whereClause}
    `;

    // const dataQuery = `
    //   SELECT id, name, slug, status, created_at, updated_at
    //   FROM store_categories
    //   WHERE store_id = '${storeId}' ${whereClause}
    //   ORDER BY ${orderBy}
    //   LIMIT $${values.length - 1} OFFSET $${values.length}
    // `;

    // const countQuery = `
    //   SELECT COUNT(*)::int AS count
    //   FROM store_categories
    //   WHERE store_id = '${storeId}' ${whereClause}
    // `;

    const [dataRes, countRes] = await Promise.all([
      pool.query(dataQuery, values),
      pool.query(countQuery, values.slice(0, where.length ? 1 : 0)),
    ]);

    return NextResponse.json({
      items: dataRes.rows,
      totalResults: countRes.rows[0].count,
      page,
      pageSize: limit,
      totalPages: Math.ceil(countRes.rows[0].count / limit),
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 },
    );
  }
}

/* ------------------------------------
   POST (create category)
------------------------------------ */
export async function POST(req: NextRequest) {
  // const store = await getCurrentStoreAPI(req);
  // const storeId = store.id;
  await requirePlatformAdmin();

  try {
    const body = await req.json();
    const { name, status = 1 } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Category is required" },
        { status: 400 },
      );
    }

    const slug = slugify(name);

    const result = await pool.query(
      `
      INSERT INTO store_categories (name, slug, status)
      VALUES ($1, $2, $3)
      RETURNING *
      `,
      [name, slug, status],
    );

    // const result = await pool.query(
    //   `
    //   INSERT INTO store_categories (store_id, name, slug, status)
    //   VALUES ($1, $2, $3, $4)
    //   RETURNING *
    //   `,
    //   [storeId, name, slug, status],
    // );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (err: any) {
    console.error(err);

    if (err.code === "23505") {
      return NextResponse.json(
        { error: "Category already exists" },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 },
    );
  }
}

/* ------------------------------------
   PUT (update category)
------------------------------------ */
export async function PUT(req: NextRequest) {
  // const store = await getCurrentStoreAPI(req);
  // const storeId = store.id;
  await requirePlatformAdmin();

  try {
    const body = await req.json();
    const { id, name, status } = body;

    const slug = name ? slugify(name) : undefined;

    if (!id) {
      return NextResponse.json(
        { error: "Category ID required" },
        { status: 400 },
      );
    }

    const result = await pool.query(
      `
      UPDATE store_categories
      SET
        name = COALESCE($1, name),
        slug = COALESCE($2, slug),
        status = COALESCE($3, status),
        updated_at = NOW()
      WHERE id = $4
      RETURNING *
      `,
      [name, slug, status, id],
    );

    // const result = await pool.query(
    //   `
    //   UPDATE store_categories
    //   SET
    //     name = COALESCE($1, name),
    //     slug = COALESCE($2, slug),
    //     status = COALESCE($3, status),
    //     updated_at = NOW()
    //   WHERE id = $4 AND store_id = $5
    //   RETURNING *
    //   `,
    //   [name, slug, status, id, storeId],
    // );

    if (!result.rows.length) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(result.rows[0]);
  } catch (err: any) {
    console.error(err);

    if (err.code === "23505") {
      return NextResponse.json(
        { error: "Category slug already exists" },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { error: "Failed to update category" },
      { status: 500 },
    );
  }
}

/* ------------------------------------
   DELETE (remove category)
------------------------------------ */
export async function DELETE(req: NextRequest) {
  // const store = await getCurrentStoreAPI(req);
  // const storeId = store.id;
  
  await requirePlatformAdmin();

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { error: "Category ID required" },
      { status: 400 },
    );
  }

  try {

    await pool.query(
      `DELETE FROM store_categories WHERE id = $1`,
      [id]
    );

    // await pool.query(
    //   `DELETE FROM store_categories 
    //   WHERE id = $1 AND store_id = $2`,
    //   [id, storeId]
    // );

    return NextResponse.json({ message: "Category deleted successfully" });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to delete category" },
      { status: 500 },
    );
  }
}