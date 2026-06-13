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

  return (
    <div className="page-wrapper">
      <div className="content">
        <RecipeForm recipe={recipe} />
      </div>
    </div>
  );
}
