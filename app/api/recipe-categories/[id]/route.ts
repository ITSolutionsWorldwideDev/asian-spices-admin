// app/api/recipe-categories/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/core/db";
import { requirePlatformAdmin } from "@/lib/auth/guards";

type Params = {
  params: Promise<{ id: string }>;
};

/* ----------------------------------------
   GET SINGLE CATEGORY
----------------------------------------- */
export async function GET(req: NextRequest, { params }: Params) {
  try {
    await requirePlatformAdmin();

    const { id } = await params;

    const { rows } = await pool.query(
      `
      SELECT
        rc.*,
        COALESCE(COUNT(r.id), 0)::int AS recipes_count
      FROM recipe_categories rc
      LEFT JOIN recipes r
        ON r.category_id = rc.id
      WHERE rc.id = $1
      GROUP BY rc.id
      `,
      [id],
    );

    if (!rows.length) {
      return NextResponse.json(
        { success: false, error: "Category not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      item: rows[0],
    });
  } catch (error: any) {
    console.error("GET recipe category error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch category",
      },
      { status: 500 },
    );
  }
}

/* ----------------------------------------
   UPDATE CATEGORY
----------------------------------------- */
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    await requirePlatformAdmin();

    const { id } = await params;

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

    // duplicate check
    const duplicate = await pool.query(
      `
      SELECT id
      FROM recipe_categories
      WHERE slug = $1
        AND id != $2
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
      UPDATE recipe_categories
      SET
        name = $1,
        slug = $2,
        description = $3,
        image_url = $4,
        is_active = $5,
        sort_order = $6,
        updated_at = NOW()
      WHERE id = $7
      RETURNING *
      `,
      [
        name,
        finalSlug,
        description || null,
        image_url || null,
        is_active,
        sort_order,
        id,
      ],
    );

    if (!rows.length) {
      return NextResponse.json(
        { success: false, error: "Category not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      item: rows[0],
      message: "Recipe category updated successfully",
    });
  } catch (error: any) {
    console.error("PUT recipe category error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to update category",
      },
      { status: 500 },
    );
  }
}

/* ----------------------------------------
   DELETE CATEGORY
----------------------------------------- */
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    await requirePlatformAdmin();

    const { id } = await params;

    // prevent delete if recipes exist
    const recipesCheck = await pool.query(
      `
      SELECT COUNT(*)::int AS total
      FROM recipes
      WHERE category_id = $1
      `,
      [id],
    );

    const totalRecipes = recipesCheck.rows[0]?.total || 0;

    if (totalRecipes > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Cannot delete category with assigned recipes",
        },
        { status: 400 },
      );
    }

    const result = await pool.query(
      `
      DELETE FROM recipe_categories
      WHERE id = $1
      RETURNING id
      `,
      [id],
    );

    if (!result.rows.length) {
      return NextResponse.json(
        { success: false, error: "Category not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Recipe category deleted successfully",
    });
  } catch (error: any) {
    console.error("DELETE recipe category error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to delete category",
      },
      { status: 500 },
    );
  }
}
