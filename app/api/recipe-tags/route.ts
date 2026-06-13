// /app/api/recipe-tags/route.ts

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/core/db";
import { requirePlatformAdmin } from "@/lib/auth/guards";

/* -----------------------------
   GET ALL TAGS
------------------------------ */
export async function GET(req: NextRequest) {
  try {
    await requirePlatformAdmin();

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";

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

    const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const { rows } = await pool.query(
      `
      SELECT
        rt.id,
        rt.name,
        rt.slug,
        rt.color,
        rt.is_active,
        rt.created_at,
        COUNT(r.id)::int AS recipes_count
      FROM recipe_tags rt
      LEFT JOIN recipe_recipe_tags rrt
        ON rrt.tag_id = rt.id
      LEFT JOIN recipes r
        ON r.id = rrt.recipe_id
      ${whereClause}
      GROUP BY rt.id
      ORDER BY rt.created_at DESC
      `,
      values,
    );

    return NextResponse.json({
      success: true,
      items: rows,
    });
  } catch (error: any) {
    console.error("GET recipe tags error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch tags",
      },
      { status: 500 },
    );
  }
}

/* -----------------------------
   POST TAG
------------------------------ */
export async function POST(req: NextRequest) {
  try {
    await requirePlatformAdmin();

    const body = await req.json();

    const { name, slug, color, is_active } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: "Tag name is required" },
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

    // check duplicate
    const existing = await pool.query(
      `
      SELECT id FROM recipe_tags
      WHERE slug = $1
      LIMIT 1
      `,
      [finalSlug],
    );

    if (existing.rows.length > 0) {
      return NextResponse.json(
        { success: false, error: "Tag slug already exists" },
        { status: 400 },
      );
    }

    const { rows } = await pool.query(
      `
      INSERT INTO recipe_tags (
        name,
        slug,
        color,
        is_active
      )
      VALUES ($1, $2, $3, $4)
      RETURNING *
      `,
      [
        name,
        finalSlug,
        color || "#ef4444",
        is_active ?? true,
      ],
    );

    return NextResponse.json({
      success: true,
      item: rows[0],
      message: "Tag created successfully",
    });
  } catch (error: any) {
    console.error("POST recipe tag error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to create tag",
      },
      { status: 500 },
    );
  }
}
