import { NextRequest, NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/lib/auth/guards";
import { generateAndSaveRecipeNutrition } from "@/lib/recipes/nutrition";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: recipeId } = await params;
    await requirePlatformAdmin();

    const body = await req.json().catch(() => ({}));

    const hasFormOverride =
      Boolean(body.title) ||
      (Array.isArray(body.ingredients) && body.ingredients.length > 0) ||
      (Array.isArray(body.instructions) && body.instructions.length > 0);

    const items = await generateAndSaveRecipeNutrition(recipeId, {
      force: true,
      input: hasFormOverride
        ? {
            title: body.title || "",
            shortDescription: body.shortDescription ?? null,
            content: body.content ?? null,
            servings:
              body.servings === "" || body.servings == null
                ? null
                : Number(body.servings),
            preparationTime: null,
            cookingTime: null,
            difficulty: null,
            ingredients: Array.isArray(body.ingredients) ? body.ingredients : [],
            instructions: Array.isArray(body.instructions)
              ? body.instructions
              : [],
          }
        : undefined,
    });

    return NextResponse.json({
      success: true,
      items,
    });
  } catch (e: unknown) {
    const message =
      e instanceof Error ? e.message : "Failed to generate nutrition";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
