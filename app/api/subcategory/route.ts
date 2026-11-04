// /app/api/subcategory/route.ts

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/core/db";
// import { getCurrentStoreAPI } from "@/lib/auth/guards";
import { requirePlatformAdmin } from "@/lib/auth/guards";

/* ------------------------------------
   Utility: slugify
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

  try {
    if (id) {
      const res = await pool.query(
        `SELECT s.*, c.name AS category
        FROM store_subcategories s
        JOIN store_categories c ON c.id = s.category_id
        WHERE s.id = $1`,
        [id]
      );

      // const res = await pool.query(
      //   `SELECT s.*, c.name AS category
      //   FROM store_subcategories s
      //   JOIN store_categories c ON c.id = s.category_id
      //   WHERE s.id = $1 AND s.store_id = $2`,
      //   [id, storeId]
      // );

      if (!res.rows.length) {
        return NextResponse.json({ error: "Subcategory not found" }, { status: 404 });
      }

      return NextResponse.json(res.rows[0]);
    }

    const res = await pool.query(
      ` SELECT s.*, c.name AS category
        FROM store_subcategories s
        JOIN store_categories c ON c.id = s.category_id
        ORDER BY s.created_at DESC`,
        []
      );

    // const res = await pool.query(
    //   ` SELECT s.*, c.name AS category
    //     FROM store_subcategories s
    //     JOIN store_categories c ON c.id = s.category_id
    //     WHERE s.store_id = $1
    //     ORDER BY s.created_at DESC`,
    //     [storeId]
    //   );

    return NextResponse.json({ items: res.rows });

  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch subcategories" }, { status: 500 });
  }
}

/* ------------------------------------
   POST
------------------------------------ */
export async function POST(req: NextRequest) {
  // const store = await getCurrentStoreAPI(req);
  // const storeId = store.id;
  await requirePlatformAdmin();

  try {
    const { category_id, name, status = 1 } = await req.json();
    if (!category_id || !name || !name.trim()) {
      return NextResponse.json({ error: "Category and name are required" }, { status: 400 });
    }

    const trimmedName = String(name).trim();
    const slug = slugify(trimmedName);

    const duplicate = await pool.query(
      `SELECT id FROM store_subcategories
       WHERE category_id = $1
         AND (LOWER(TRIM(name)) = LOWER($2) OR slug = $3)
       LIMIT 1`,
      [category_id, trimmedName, slug],
    );

    if (duplicate.rows.length) {
      return NextResponse.json(
        { error: "Subcategory already exists in this category" },
        { status: 409 },
      );
    }

    const res = await pool.query(
      `INSERT INTO store_subcategories
       (category_id, name, slug, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       RETURNING *`,
      [category_id, trimmedName, slug, status]
    );

    // const res = await pool.query(
    //   `INSERT INTO store_subcategories
    //    (store_id, category_id, name, slug, status, created_at, updated_at)
    //    VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
    //    RETURNING *`,
    //   [storeId, category_id, name, slug, status]
    // );

    return NextResponse.json(res.rows[0], { status: 201 });

  } catch (err: any) {
    console.error(err);

    if (err?.code === "23505") {
      return NextResponse.json(
        { error: "Subcategory already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json({ error: "Failed to create subcategory" }, { status: 500 });
  }
}

/* ------------------------------------
   PUT
------------------------------------ */
export async function PUT(req: NextRequest) {
  // const store = await getCurrentStoreAPI(req);
  // const storeId = store.id;
  
  await requirePlatformAdmin();

  try {
    const { id, category_id, name, status } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "Subcategory ID required" }, { status: 400 });
    }

    const trimmedName = name != null ? String(name).trim() : undefined;
    const slug = trimmedName ? slugify(trimmedName) : undefined;

    if (trimmedName) {
      const existing = await pool.query(
        `SELECT category_id FROM store_subcategories WHERE id = $1`,
        [id],
      );

      if (!existing.rows.length) {
        return NextResponse.json({ error: "Subcategory not found" }, { status: 404 });
      }

      const categoryId = existing.rows[0].category_id;
      const duplicate = await pool.query(
        `SELECT id FROM store_subcategories
         WHERE category_id = $1
           AND id <> $2
           AND (LOWER(TRIM(name)) = LOWER($3) OR slug = $4)
         LIMIT 1`,
        [categoryId, id, trimmedName, slug],
      );

      if (duplicate.rows.length) {
        return NextResponse.json(
          { error: "Subcategory already exists in this category" },
          { status: 409 },
        );
      }
    }

    const res = await pool.query(
      `UPDATE store_subcategories
       SET
         category_id = COALESCE($1, category_id),
         name = COALESCE($2, name),
         slug = COALESCE($3, slug),
         status = COALESCE($4, status),
         updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [trimmedName ?? null, slug ?? null, status, id]
    );

    // const res = await pool.query(
    //   `UPDATE store_subcategories
    //    SET
    //      name = COALESCE($1, name),
    //      slug = COALESCE($2, slug),
    //      status = COALESCE($3, status),
    //      updated_at = NOW()
    //    WHERE id = $4 AND store_id = $5
    //    RETURNING *`,
    //   [name, slug, status, id, storeId]
    // );

    if (!res.rows.length) {
      return NextResponse.json({ error: "Subcategory not found" }, { status: 404 });
    }

    return NextResponse.json(res.rows[0]);
  } catch (err: any) {
    console.error(err);

    if (err?.code === "23505") {
      return NextResponse.json(
        { error: "Subcategory already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json({ error: "Failed to update subcategory" }, { status: 500 });
  }
}

/* ------------------------------------
   DELETE
------------------------------------ */
export async function DELETE(req: NextRequest) {
  // const store = await getCurrentStoreAPI(req);
  // const storeId = store.id;
  
  await requirePlatformAdmin();

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Subcategory ID required" }, { status: 400 });
  }

  try {
    const res = await pool.query(
      `DELETE FROM store_subcategories WHERE id = $1 RETURNING *`,
      [id]
    );

    // const res = await pool.query(
    //   `DELETE FROM store_subcategories WHERE id = $1 AND store_id = $2 RETURNING *`,
    //   [id, storeId]
    // );

    if (!res.rows.length) {
      return NextResponse.json({ error: "Subcategory not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Subcategory deleted successfully" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to delete subcategory" }, { status: 500 });
  }
}
