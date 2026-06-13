// /app/api/brand/route.ts

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
   GET
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
    /* -------- Single brand -------- */
    if (id) {
      // const result = await pool.query(
      //   `SELECT * FROM store_brands
      //    WHERE brand_id = $1 AND store_id = $2`,
      //   [id, storeId],
      // );

      const result = await pool.query(
        `SELECT * FROM store_brands
         WHERE brand_id = $1`,
        [id],
      );

      if (!result.rows.length) {
        return NextResponse.json({ error: "Brand not found" }, { status: 404 });
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

    const whereClause = where.length ? `AND ${where.join(" AND ")}` : "";

    let orderBy = "created_at DESC";
    if (sort === "nameAsc") orderBy = "name ASC";
    if (sort === "nameDesc") orderBy = "name DESC";
    if (sort === "dateAsc") orderBy = "created_at ASC";

    values.push(limit, offset);

    const dataQuery = `
      SELECT *
      FROM store_brands
      WHERE 1 = 1 ${whereClause}
      ORDER BY ${orderBy}
      LIMIT $${values.length - 1} OFFSET $${values.length}
    `;

    const countQuery = `
      SELECT COUNT(*)::int AS count
      FROM store_brands
      WHERE 1 = 1 ${whereClause}
    `;

    // const dataQuery = `
    //   SELECT *
    //   FROM store_brands
    //   WHERE store_id = '${storeId}' ${whereClause}
    //   ORDER BY ${orderBy}
    //   LIMIT $${values.length - 1} OFFSET $${values.length}
    // `;

    // const countQuery = `
    //   SELECT COUNT(*)::int AS count
    //   FROM store_brands
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
      { error: "Failed to fetch brands" },
      { status: 500 },
    );
  }
}

/* ------------------------------------
   POST (create brand)
------------------------------------ */
export async function POST(req: NextRequest) {
  // const store = await getCurrentStoreAPI(req);
  // const storeId = store.id;
  await requirePlatformAdmin();

  try {
    const { name, description, logo_url, status = true } = await req.json();

    if (!name) {
      return NextResponse.json(
        { error: "Brand name is required" },
        { status: 400 },
      );
    }

    const slug = slugify(name);

    const result = await pool.query(
      `
      INSERT INTO store_brands
      (name, slug, description, logo_url, status, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      RETURNING *
      `,
      [name, slug, description || null, logo_url || null, status],
    );

    // const result = await pool.query(
    //   `
    //   INSERT INTO store_brands
    //   (store_id, name, slug, description, logo_url, status, created_at, updated_at)
    //   VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
    //   RETURNING *
    //   `,
    //   [storeId, name, slug, description || null, logo_url || null, status],
    // );

    return NextResponse.json(result.rows[0], { status: 201 });
    
  } catch (err: any) {
    console.error(err);

    if (err.code === "23505") {
      return NextResponse.json(
        { error: "Brand already exists" },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { error: "Failed to create brand" },
      { status: 500 },
    );
  }
}

/* ------------------------------------
   PUT (update brand)
------------------------------------ */
export async function PUT(req: NextRequest) {
  // const store = await getCurrentStoreAPI(req);
  // const storeId = store.id;
  await requirePlatformAdmin();

  try {
    const { brand_id, name, description, logo_url, status } = await req.json();

    if (!brand_id) {
      return NextResponse.json({ error: "Brand ID required" }, { status: 400 });
    }

    const slug = name ? slugify(name) : undefined;

    const result = await pool.query(
      `
      UPDATE store_brands
      SET
        name = COALESCE($1, name),
        slug = COALESCE($2, slug),
        description = COALESCE($3, description),
        logo_url = COALESCE($4, logo_url),
        status = COALESCE($5, status),
        updated_at = NOW()
      WHERE brand_id = $6
      RETURNING *
      `,
      [name, slug, description, logo_url, status, brand_id],
    );

    // const result = await pool.query(
    //   `
    //   UPDATE store_brands
    //   SET
    //     name = COALESCE($1, name),
    //     slug = COALESCE($2, slug),
    //     description = COALESCE($3, description),
    //     logo_url = COALESCE($4, logo_url),
    //     status = COALESCE($5, status),
    //     updated_at = NOW()
    //   WHERE brand_id = $6
    //     AND store_id = $7
    //   RETURNING *
    //   `,
    //   [name, slug, description, logo_url, status, brand_id, storeId],
    // );

    if (!result.rows.length) {
      return NextResponse.json(
        { error: "Brand not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0]);

  } catch (err: any) {
    console.error(err);

    if (err.code === "23505") {
      return NextResponse.json(
        { error: "Brand name already exists" },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { error: "Failed to update brand" },
      { status: 500 },
    );
  }
}

/* ------------------------------------
   DELETE (remove brand)
------------------------------------ */
export async function DELETE(req: NextRequest) {
  // const store = await getCurrentStoreAPI(req);
  // const storeId = store.id;
  await requirePlatformAdmin();

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Brand ID required" }, { status: 400 });
  }

  try {
    const result = await pool.query(
      `
      DELETE FROM store_brands
      WHERE brand_id = $1
      RETURNING *
      `,
      [id],
    );
    // const result = await pool.query(
    //   `
    //   DELETE FROM store_brands
    //   WHERE brand_id = $1
    //     AND store_id = $2
    //   RETURNING *
    //   `,
    //   [id, storeId],
    // );

    if (!result.rows.length) {
      return NextResponse.json(
        { error: "Brand not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Brand deleted successfully",
    });

  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to delete brand" },
      { status: 500 },
    );
  }
}
