// /app/api/recipe-tags/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/core/db";
import { requirePlatformAdmin } from "@/lib/auth/guards";

/* -----------------------------
   GET SINGLE TAG
------------------------------ */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requirePlatformAdmin();

    const { id } = await params;

    const { rows } = await pool.query(
      `
      SELECT
        rt.*,
        COUNT(rrt.recipe_id)::int AS recipes_count
      FROM recipe_tags rt
      LEFT JOIN recipe_recipe_tags rrt
        ON rrt.tag_id = rt.id
      WHERE rt.id = $1
      GROUP BY rt.id
      `,
      [id],
    );

    if (!rows.length) {
      return NextResponse.json(
        { success: false, error: "Tag not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      item: rows[0],
    });
  } catch (error: any) {
    console.error("GET tag error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch tag",
      },
      { status: 500 },
    );
  }
}

/* -----------------------------
   UPDATE TAG
------------------------------ */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requirePlatformAdmin();

    const { id } = await params;
    const body = await req.json();

    const { name, slug, color, is_active } = body;

    console.log('body ==== ',body);

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

    // duplicate check
    const duplicate = await pool.query(
      `
      SELECT id FROM recipe_tags
      WHERE slug = $1 AND id != $2
      LIMIT 1
      `,
      [finalSlug, id],
    );

    if (duplicate.rows.length > 0) {
      return NextResponse.json(
        { success: false, error: "Slug already exists" },
        { status: 400 },
      );
    }

    const { rows } = await pool.query(
      `
      UPDATE recipe_tags
      SET
        name = $1,
        slug = $2,
        color = $3,
        is_active = $4
      WHERE id = $5
      RETURNING *
      `,
      [name, finalSlug, color || "#ef4444", is_active ?? true, id],
    );

    if (!rows.length) {
      return NextResponse.json(
        { success: false, error: "Tag not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      item: rows[0],
      message: "Tag updated successfully",
    });
  } catch (error: any) {
    console.error("PUT tag error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to update tag",
      },
      { status: 500 },
    );
  }
}

/* -----------------------------
   DELETE TAG
------------------------------ */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requirePlatformAdmin();

    const { id } = await params;

    // optional safety check
    const usage = await pool.query(
      `
      SELECT COUNT(*)::int AS total
      FROM recipe_recipe_tags
      WHERE tag_id = $1
      `,
      [id],
    );

    if (Number(usage.rows[0].total) > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Cannot delete tag in use by recipes",
        },
        { status: 400 },
      );
    }

    const result = await pool.query(
      `
      DELETE FROM recipe_tags
      WHERE id = $1
      RETURNING id
      `,
      [id],
    );

    if (!result.rows.length) {
      return NextResponse.json(
        { success: false, error: "Tag not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Tag deleted successfully",
    });
  } catch (error: any) {
    console.error("DELETE tag error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to delete tag",
      },
      { status: 500 },
    );
  }
}
