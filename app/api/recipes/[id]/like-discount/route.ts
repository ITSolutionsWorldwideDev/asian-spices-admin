import { NextRequest, NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/lib/auth/guards";
import { suggestedDiscountFromLikes } from "@/lib/recipes/like-discount-utils";
import { saveRecipeLikeDiscount } from "@/lib/recipes/like-discounts";
import { pool } from "@/core/db";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requirePlatformAdmin();
    const { id: recipeId } = await params;
    const body = await req.json();

    const discountType =
      body.discountType === "FLAT" ? "FLAT" : "PERCENT";
    const discountValue = Number(body.discountValue);

    if (Number.isNaN(discountValue) || discountValue < 0) {
      return NextResponse.json(
        { success: false, error: "Invalid discount value" },
        { status: 400 },
      );
    }

    if (discountType === "PERCENT" && discountValue > 100) {
      return NextResponse.json(
        { success: false, error: "Percent discount cannot exceed 100" },
        { status: 400 },
      );
    }

    const { rows: recipeRows } = await pool.query(
      `
      SELECT id, created_by
      FROM recipes
      WHERE id = $1
      `,
      [recipeId],
    );

    const recipe = recipeRows[0];
    if (!recipe) {
      return NextResponse.json(
        { success: false, error: "Recipe not found" },
        { status: 404 },
      );
    }

    const { rows: likesRows } = await pool.query(
      `
      SELECT COUNT(*)::int AS count
      FROM recipe_favorites
      WHERE recipe_id = $1
      `,
      [recipeId],
    );

    const likesCount = likesRows[0]?.count ?? 0;
    const ownerId = body.userId || recipe.created_by || null;

    const item = await saveRecipeLikeDiscount({
      recipeId,
      userId: ownerId,
      discountType,
      discountValue,
      likesCount,
      updatedBy: user.id,
    });

    return NextResponse.json({
      success: true,
      item,
      suggestedDiscount: suggestedDiscountFromLikes(likesCount),
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Failed to save discount";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
