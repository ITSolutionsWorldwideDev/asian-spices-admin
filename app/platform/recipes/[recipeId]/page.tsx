// app/platform/recipes/[recipeId]/page.tsx

import { pool } from "@/core/db";
import RecipeForm from "./RecipeForm";

export default async function EditRecipePage({
  params,
}: {
  params: Promise<{ recipeId: string }>;
}) {
  const { recipeId } = await params;

  /* 
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (!uuidRegex.test(recipeId)) {
    notFound();
  }
  */

  const { rows } = await pool.query(
    `
    SELECT
      r.*,
      COALESCE(
        ARRAY_AGG(rrt.tag_id)
        FILTER (WHERE rrt.tag_id IS NOT NULL),
        '{}'
      ) AS tag_ids
    FROM recipes r
    LEFT JOIN recipe_recipe_tags rrt
      ON rrt.recipe_id = r.id
    WHERE r.id = $1
    GROUP BY r.id
    `,
    [recipeId],
  );

  const recipe = rows[0];

  if (!recipe) {
    return <p>Recipe not found</p>;
  }

  const [
    ingredientsRes,
    instructionsRes,
    nutritionRes,
    ownerRes,
    likesCountRes,
    favoritesRes,
  ] = await Promise.all([
    pool.query(
      `
      SELECT ingredients_id, ingredient_name, quantity, unit
      FROM recipe_ingredients
      WHERE recipe_id = $1
      ORDER BY created_at ASC
      `,
      [recipeId],
    ),
    pool.query(
      `
      SELECT instruction_id, step_number, step_title, step_description, duration_minutes
      FROM recipe_instructions
      WHERE recipe_id = $1
      ORDER BY step_number ASC, created_at ASC
      `,
      [recipeId],
    ),
    pool.query(
      `
      SELECT nutrition_id, nutrient_name, value, unit, daily_value_percent
      FROM recipe_nutrition
      WHERE recipe_id = $1
      ORDER BY nutrient_name ASC
      `,
      [recipeId],
    ),
    pool.query(
      `
      SELECT u.id, u.name, u.email
      FROM recipes r
      LEFT JOIN users u ON u.id = r.created_by
      WHERE r.id = $1
      `,
      [recipeId],
    ),
    pool.query(
      `
      SELECT COUNT(*)::int AS count
      FROM recipe_favorites
      WHERE recipe_id = $1
      `,
      [recipeId],
    ),
    pool.query(
      `
      SELECT
        rf.id,
        rf.created_at,
        rf.customer_id,
        TRIM(
          COALESCE(sc.first_name, '') || ' ' || COALESCE(sc.last_name, '')
        ) AS customer_name,
        sc.email AS customer_email
      FROM recipe_favorites rf
      LEFT JOIN store_customers sc ON sc.id = rf.customer_id
      WHERE rf.recipe_id = $1
      ORDER BY rf.created_at DESC
      LIMIT 20
      `,
      [recipeId],
    ),
  ]);

  recipe.ingredients = ingredientsRes.rows;
  recipe.instructions = instructionsRes.rows;
  recipe.nutrition = nutritionRes.rows;
  recipe.owner = ownerRes.rows[0]?.id ? ownerRes.rows[0] : null;
  recipe.likes_count = likesCountRes.rows[0]?.count ?? 0;
  recipe.recent_favorites = favoritesRes.rows;

  return (
    <div className="page-wrapper">
      <div className="content">
        <RecipeForm recipe={recipe} />
      </div>
    </div>
  );
}
