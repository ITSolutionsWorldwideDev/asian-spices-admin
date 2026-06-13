// /app/api/recipe-categories/route.ts

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/core/db";
import { requirePlatformAdmin } from "@/lib/auth/guards";

/* ----------------------------------------
   GET: List Recipe Categories
----------------------------------------- */
export async function GET(req: NextRequest) {
  try {
    await requirePlatformAdmin();

    const { searchParams } = new URL(req.url);

    const q = searchParams.get("q") || "";
    const is_active = searchParams.get("is_active");

    const values: any[] = [];
    const where: string[] = [];

    if (q) {
      values.push(`%${q}%`);
      where.push(`
        (
          name ILIKE $${values.length}
          OR slug ILIKE $${values.length}
        )
      `);
    }

    if (is_active !== null && is_active !== "") {
      values.push(is_active === "true");
      where.push(`is_active = $${values.length}`);
    }

    const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const query = `
      SELECT
        rc.id,
        rc.name,
        rc.slug,
        rc.description,
        rc.image_url,
        rc.is_active,
        rc.sort_order,
        rc.created_at,
        rc.updated_at,
        COALESCE(COUNT(r.id), 0)::int AS recipes_count
      FROM recipe_categories rc
      LEFT JOIN recipes r
        ON r.category_id = rc.id
      ${whereClause}
      GROUP BY rc.id
      ORDER BY rc.sort_order ASC, rc.created_at DESC
    `;

    const { rows } = await pool.query(query, values);

    return NextResponse.json({
      success: true,
      items: rows,
    });
  } catch (error: any) {
    console.error("GET recipe categories error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch categories",
      },
      { status: 500 },
    );
  }
}

/* ----------------------------------------
   POST: Create Category
----------------------------------------- */
export async function POST(req: NextRequest) {
  try {
    await requirePlatformAdmin();

    const body = await req.json();

    const {
      name,
      slug,
      description,
      image_url,
      is_active = true,
      sort_order = 0,
    } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: "Category name is required" },
        { status: 400 },
      );
    }

    const finalSlug =
      slug ||
      name
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^\w-]+/g, "");

    // duplicate check (GLOBAL)
    const existing = await pool.query(
      `
      SELECT id
      FROM recipe_categories
      WHERE slug = $1
      LIMIT 1
      `,
      [finalSlug],
    );

    if (existing.rows.length > 0) {
      return NextResponse.json(
        { success: false, error: "Category slug already exists" },
        { status: 400 },
      );
    }

    const { rows } = await pool.query(
      `
      INSERT INTO recipe_categories (
        name,
        slug,
        description,
        image_url,
        is_active,
        sort_order
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
      `,
      [
        name,
        finalSlug,
        description || null,
        image_url || null,
        is_active,
        sort_order,
      ],
    );

    return NextResponse.json({
      success: true,
      item: rows[0],
      message: "Recipe category created successfully",
    });
  } catch (error: any) {
    console.error("POST recipe category error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to create category",
      },
      { status: 500 },
    );
  }
}