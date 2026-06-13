// /app/api/subcategory/route.ts

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/core/db";
// import { getCurrentStoreAPI } from "@/lib/auth/guards";
import { requirePlatformAdmin } from "@/lib/auth/guards";

/* ------------------------------------
   Utils
------------------------------------ */
// const generateCategoryCode = async (category_id: number) => {
//   // Get parent category slug
//   const catRes = await pool.query(
//     `SELECT categoryslug FROM categories WHERE category_id = $1`,
//     [category_id]
//   );

//   if (!catRes.rows.length) {
//     throw new Error("Invalid category");
//   }

//   const alias = catRes.rows[0].categoryslug
//     .substring(0, 2)
//     .toUpperCase();

//   // Count existing subcategories
//   const countRes = await pool.query(
//     `SELECT COUNT(*)::int AS count FROM subcategories WHERE category_id = $1`,
//     [category_id]
//   );

//   const nextNumber = String(countRes.rows[0].count + 1).padStart(2, "0");

//   return `${alias}${nextNumber}`;
// };

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
    if (!category_id || !name) {
      return NextResponse.json({ error: "Category and name are required" }, { status: 400 });
    }

    const slug = slugify(name);

    const res = await pool.query(
      `INSERT INTO store_subcategories
       (category_id, name, slug, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       RETURNING *`,
      [category_id, name, slug, status]
    );

    // const res = await pool.query(
    //   `INSERT INTO store_subcategories
    //    (store_id, category_id, name, slug, status, created_at, updated_at)
    //    VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
    //    RETURNING *`,
    //   [storeId, category_id, name, slug, status]
    // );

    return NextResponse.json(res.rows[0], { status: 201 });

  } catch (err) {
    console.error(err);
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
    const { id, name, status } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "Subcategory ID required" }, { status: 400 });
    }

    const slug = name ? slugify(name) : undefined;

    const res = await pool.query(
      `UPDATE store_subcategories
       SET
         name = COALESCE($1, name),
         slug = COALESCE($2, slug),
         status = COALESCE($3, status),
         updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [name, slug, status, id]
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
  } catch (err) {
    console.error(err);
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