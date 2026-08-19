export type RecipeNutritionInput = {
  title: string;
  shortDescription?: string | null;
  content?: string | null;
  servings?: number | null;
  preparationTime?: number | null;
  cookingTime?: number | null;
  difficulty?: string | null;
  ingredients: {
    ingredient_name: string;
    quantity?: number | string | null;
    unit?: string | null;
  }[];
  instructions: {
    step_title?: string | null;
    step_description?: string | null;
  }[];
};

export type GeneratedNutritionItem = {
  nutrient_name: string;
  value: number;
  unit: string;
  daily_value_percent: number | null;
};

function stripHtml(value: string) {
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function parseGeminiJson(text: string): GeneratedNutritionItem[] {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = (fenced?.[1] ?? text).trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start === -1 || end === -1) {
      throw new Error("Gemini did not return valid JSON");
    }
    parsed = JSON.parse(raw.slice(start, end + 1));
  }

  const items = Array.isArray(parsed)
    ? parsed
    : (parsed as { nutrition?: unknown }).nutrition;

  if (!Array.isArray(items)) {
    throw new Error("Gemini response missing nutrition array");
  }

  return items
    .map((item) => {
      const row = item as Record<string, unknown>;
      const nutrientName = String(row.nutrient_name || row.name || "").trim();
      const value = Number(row.value);
      const unit = String(row.unit || "").trim();
      const dailyValue =
        row.daily_value_percent == null || row.daily_value_percent === ""
          ? null
          : Number(row.daily_value_percent);

      if (!nutrientName || Number.isNaN(value) || !unit) {
        return null;
      }

      return {
        nutrient_name: nutrientName.slice(0, 100),
        value: Math.round(value * 100) / 100,
        unit: unit.slice(0, 20),
        daily_value_percent:
          dailyValue == null || Number.isNaN(dailyValue)
            ? null
            : Math.round(dailyValue * 100) / 100,
      };
    })
    .filter((item): item is GeneratedNutritionItem => item !== null);
}

export async function generateRecipeNutritionWithGemini(
  recipe: RecipeNutritionInput,
): Promise<GeneratedNutritionItem[]> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const ingredientLines = recipe.ingredients
    .filter((item) => item.ingredient_name?.trim())
    .map((item) => {
      const qty =
        item.quantity == null || item.quantity === ""
          ? ""
          : `${item.quantity}`;
      const unit = item.unit ? ` ${item.unit}` : "";
      return `- ${item.ingredient_name}${qty ? `: ${qty}${unit}` : ""}`;
    })
    .join("\n");

  const instructionLines = recipe.instructions
    .map((item, index) => {
      const title = item.step_title?.trim();
      const description = item.step_description?.trim();
      if (!title && !description) return null;
      return `${index + 1}. ${[title, description].filter(Boolean).join(": ")}`;
    })
    .filter(Boolean)
    .join("\n");

  const prompt = `
You are a nutrition analyst. Estimate nutrition facts per serving for this recipe.

Recipe title: ${recipe.title}
Short description: ${recipe.shortDescription || "N/A"}
Servings: ${recipe.servings ?? "unknown"}
Preparation time (minutes): ${recipe.preparationTime ?? "unknown"}
Cooking time (minutes): ${recipe.cookingTime ?? "unknown"}
Difficulty: ${recipe.difficulty || "unknown"}

Ingredients:
${ingredientLines || "No ingredients listed"}

Instructions:
${instructionLines || "No instructions listed"}

Additional content:
${stripHtml(recipe.content || "") || "N/A"}

Return ONLY valid JSON in this exact shape:
{
  "nutrition": [
    {
      "nutrient_name": "Calories",
      "value": 250,
      "unit": "kcal",
      "daily_value_percent": 12.5
    }
  ]
}

Rules:
- Provide realistic estimates based on the ingredients and portions.
- Include at least: Calories, Total Fat, Saturated Fat, Cholesterol, Sodium, Total Carbohydrate, Dietary Fiber, Total Sugars, Protein.
- Values are per one serving.
- daily_value_percent may be null when unknown.
- nutrient_name max 100 chars, unit max 20 chars.
- value and daily_value_percent must be numbers, not strings.
`.trim();

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json",
        },
      }),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error("Gemini returned an empty response");
  }

  const nutrition = parseGeminiJson(text);

  if (nutrition.length === 0) {
    throw new Error("Gemini did not return any nutrition rows");
  }

  return nutrition;
}
