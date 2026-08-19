import { pool } from "@/core/db";
import { suggestedDiscountFromLikes } from "@/lib/recipes/like-discount-utils";

export { suggestedDiscountFromLikes };

export async function saveRecipeLikeDiscount(input: {
  recipeId: string;
  userId?: string | null;
  discountType: "PERCENT" | "FLAT";
  discountValue: number;
  likesCount: number;
  updatedBy: string;
}) {
  const { rows } = await pool.query(
    `
    INSERT INTO recipe_like_discounts (
      recipe_id,
      user_id,
      discount_type,
      discount_value,
      likes_count,
      updated_by,
      created_at,
      updated_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
    ON CONFLICT (recipe_id)
    DO UPDATE SET
      user_id = EXCLUDED.user_id,
      discount_type = EXCLUDED.discount_type,
      discount_value = EXCLUDED.discount_value,
      likes_count = EXCLUDED.likes_count,
      updated_by = EXCLUDED.updated_by,
      updated_at = NOW()
    RETURNING *
    `,
    [
      input.recipeId,
      input.userId || null,
      input.discountType,
      input.discountValue,
      input.likesCount,
      input.updatedBy,
    ],
  );

  return rows[0];
}
