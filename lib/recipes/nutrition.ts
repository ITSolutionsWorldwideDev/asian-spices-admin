import { pool } from "@/core/db";
import {
  generateRecipeNutritionWithGemini,
  type GeneratedNutritionItem,
  type RecipeNutritionInput,
} from "@/lib/gemini/recipe-nutrition";
import type { PoolClient } from "pg";

export async function replaceRecipeNutrition(
  recipeId: string,
  items: {
    nutrient_name: string;
    value: number | string;
    unit?: string | null;
    daily_value_percent?: number | string | null;
  }[],
  db: Pick<PoolClient, "query"> = pool,
) {
  await db.query(`DELETE FROM recipe_nutrition WHERE recipe_id = $1`, [
    recipeId,
  ]);

  for (const item of items) {
    const nutrientName = String(item.nutrient_name || "").trim();
    if (!nutrientName) continue;

    const value =
      item.value === "" || item.value == null ? null : Number(item.value);
    if (value == null || Number.isNaN(value)) continue;

    const dailyValue =
      item.daily_value_percent === "" || item.daily_value_percent == null
        ? null
        : Number(item.daily_value_percent);

    await db.query(
      `
      INSERT INTO recipe_nutrition (
        nutrition_id,
        recipe_id,
        nutrient_name,
        value,
        unit,
        daily_value_percent
      )
      VALUES (gen_random_uuid(), $1, $2, $3, $4, $5)
      `,
      [
        recipeId,
        nutrientName,
        value,
        item.unit || null,
        dailyValue == null || Number.isNaN(dailyValue) ? null : dailyValue,
      ],
    );
  }
}

export async function loadRecipeNutritionInput(
  recipeId: string,
): Promise<RecipeNutritionInput | null> {
  const { rows: recipeRows } = await pool.query(
    `
    SELECT
      title,
      short_description,
      content,
      servings,
      preparation_time,
      cooking_time,
      difficulty
    FROM recipes
    WHERE id = $1
    `,
    [recipeId],
  );

  const recipe = recipeRows[0];
  if (!recipe) return null;

  const [ingredientsRes, instructionsRes] = await Promise.all([
    pool.query(
      `
      SELECT ingredient_name, quantity, unit
      FROM recipe_ingredients
      WHERE recipe_id = $1
      ORDER BY created_at ASC
      `,
      [recipeId],
    ),
    pool.query(
      `
      SELECT step_title, step_description
      FROM recipe_instructions
      WHERE recipe_id = $1
      ORDER BY step_number ASC, created_at ASC
      `,
      [recipeId],
    ),
  ]);

  return {
    title: recipe.title,
    shortDescription: recipe.short_description,
    content: recipe.content,
    servings: recipe.servings,
    preparationTime: recipe.preparation_time,
    cookingTime: recipe.cooking_time,
    difficulty: recipe.difficulty,
    ingredients: ingredientsRes.rows,
    instructions: instructionsRes.rows,
  };
}

export async function recipeHasNutrition(recipeId: string) {
  const { rows } = await pool.query(
    `
    SELECT 1
    FROM recipe_nutrition
    WHERE recipe_id = $1
    LIMIT 1
    `,
    [recipeId],
  );

  return rows.length > 0;
}

export async function generateAndSaveRecipeNutrition(
  recipeId: string,
  options: { force?: boolean; input?: RecipeNutritionInput } = {},
): Promise<GeneratedNutritionItem[]> {
  if (!options.force && (await recipeHasNutrition(recipeId))) {
    return [];
  }

  const input = options.input ?? (await loadRecipeNutritionInput(recipeId));
  if (!input) {
    throw new Error("Recipe not found");
  }

  const generated = await generateRecipeNutritionWithGemini(input);
  await replaceRecipeNutrition(recipeId, generated);
  return generated;
}
