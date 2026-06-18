// components/platform/recipes/actions.ts

"use server";

import { pool } from "@/core/db";
import { requirePlatformAdmin } from "@/lib/auth/guards";
import { revalidatePath } from "next/cache";
import { logAudit } from "@/lib/audit";
import { redirect } from "next/navigation";
import { recipeSchema } from "@/lib/validations/recipeSchema";
import { extractYoutubeData } from "@/core/utils";
import { ZodError } from "zod";

function formatZodError(error: ZodError) {
  return error.issues
    .map((err) => {
      const field = err.path.join(".");
      return `${field || "field"}: ${err.message}`;
    })
    .join(", ");
}

/* function extractYoutubeId(url: string) {
  try {
    const parsed = new URL(url);

    // youtube.com/watch?v=
    if (parsed.hostname.includes("youtube.com")) {
      return parsed.searchParams.get("v");
    }

    // youtu.be/
    if (parsed.hostname.includes("youtu.be")) {
      return parsed.pathname.replace("/", "");
    }

    return null;
  } catch {
    return null;
  }
} */

export async function deleteRecipe(recipeId: string) {
  const user = await requirePlatformAdmin();

  await pool.query(
    `
    DELETE FROM recipes
    WHERE id = $1
    `,
    [recipeId],
  );

  await logAudit({
    actorId: user.id,
    action: "recipe.delete",
    entity: "recipe",
    entityId: recipeId,
  });

  revalidatePath("/platform/recipes");
}

export async function setRecipeStatus(
  recipeId: string,
  status: "draft" | "published" | "archived",
) {
  const user = await requirePlatformAdmin();

  await pool.query(
    `
    UPDATE recipes
    SET
      status = $1,
      updated_at = NOW()
    WHERE id = $2
    RETURNING id
    `,
    [status, recipeId],
  );

  await logAudit({
    actorId: user.id,
    action: `recipe.${status}`,
    entity: "recipe",
    entityId: recipeId,
  });

  revalidatePath("/platform/recipes");

  revalidatePath(`/platform/recipes/${recipeId}`);
}

export async function saveRecipe(
  recipeId: string | undefined,
  formData: FormData,
) {
  const user = await requirePlatformAdmin();

  const data = Object.fromEntries(formData.entries());

  const tagIds = JSON.parse((data.tagIds as string) || "[]");

  const validated = recipeSchema.safeParse(data);

  if (!validated.success) {
    return {
      success: false,
      message: formatZodError(validated.error),
      errors: validated.error.flatten().fieldErrors,
    };
  }

  const {
    title,
    slug,
    shortDescription,
    content,
    youtubeUrl,
    thumbnailUrl,
    categoryId,
    status,
    seoTitle,
    seoDescription,
    seoKeywords,
    preparationTime,
    cookingTime,
    servings,
    difficulty,
    isFeatured,
  } = data;

  let youtubeData = null;
  let youtubeVideoId = null;
  let finalThumbnailUrl = null;

  if (youtubeUrl) {
    youtubeData = extractYoutubeData(youtubeUrl as string);

    if (!youtubeData) {
      return {
        success: false,
        error: "Invalid YouTube URL",
      };
    }

    youtubeVideoId = youtubeData.videoId;
    finalThumbnailUrl = thumbnailUrl || youtubeData.thumbnailUrl;
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    let finalRecipeId = recipeId;

    if (recipeId) {
      /*
       * UPDATE
       */
      await client.query(
        `
        UPDATE recipes
        SET
          title = $1,
          slug = $2,
          short_description = $3,
          content = $4,
          youtube_url = $5,
          youtube_video_id = $6,
          thumbnail_url = $7,
          category_id = $8,
          status = $9,
          seo_title = $10,
          seo_description = $11,
          seo_keywords = $12,
          preparation_time = $13,
          cooking_time = $14,
          servings = $15,
          difficulty = $16,
          is_featured = $17,
          updated_at = NOW()

        WHERE id = $18
        `,
        [
          title,
          slug,
          shortDescription || null,
          // content ? JSON.stringify(content) : JSON.stringify({}),
          content || null,
          youtubeUrl,
          youtubeVideoId,
          finalThumbnailUrl,
          categoryId,
          status || "draft",
          seoTitle || null,
          seoDescription || null,
          seoKeywords || null,
          preparationTime || null,
          cookingTime || null,
          servings || null,
          difficulty || null,
          isFeatured === "true",
          recipeId,
        ],
      );

      await logAudit({
        actorId: user.id,
        action: "recipe.update",
        entity: "recipe",
        entityId: recipeId,
      });
    } else {
      /*
       * CREATE
       */
      const result = await client.query(
        `
          INSERT INTO recipes (
            title,
            slug,
            short_description,
            content,
            youtube_url,
            youtube_video_id,
            thumbnail_url,
            category_id,
            status,
            seo_title,
            seo_description,
            seo_keywords,
            preparation_time,
            cooking_time,
            servings,
            difficulty,
            is_featured,
            created_by
          )
          VALUES (
            $1,$2,$3,$4,$5,$6,$7,$8,$9,
            $10,$11,$12,$13,$14,$15,$16,
            $17,$18
          )
            
        RETURNING id
          `,
        [
          title,
          slug,
          shortDescription || null,
          // content ? JSON.stringify(content) : JSON.stringify({}),
          content || null,
          youtubeUrl,
          youtubeVideoId,
          finalThumbnailUrl,
          categoryId,
          status || "draft",
          seoTitle || null,
          seoDescription || null,
          seoKeywords || null,
          preparationTime || null,
          cookingTime || null,
          servings || null,
          difficulty || null,
          isFeatured === "true",
          user.id,
        ],
      );

      finalRecipeId = result.rows[0].id;

      await logAudit({
        actorId: user.id,
        action: "recipe.create",
        entity: "recipe",
        entityId: finalRecipeId,
      });
    }

    await client.query(
      `
      DELETE FROM recipe_recipe_tags
      WHERE recipe_id = $1
      `,
      [finalRecipeId],
    );

    for (const tagId of tagIds) {
      await client.query(
        `
        INSERT INTO recipe_recipe_tags (
          recipe_id,
          tag_id
        )
        VALUES ($1, $2)
        `,
        [finalRecipeId, tagId],
      );
    }

    await client.query("COMMIT");

    revalidatePath("/platform/recipes");

    if (finalRecipeId) {
      revalidatePath(`/platform/recipes/${finalRecipeId}`);
    }

    return {
      success: true,
      recipeId: finalRecipeId,
      message: recipeId ? "Recipe updated" : "Recipe created",
    };
  } catch (err: any) {
    await client.query("ROLLBACK");

    if (err.code === "23505") {
      return {
        success: false,
        error: err.message || "Slug already exists",
      };
    }

    return {
      success: false,
      error: err.message || "Failed to save recipe",
    };
  } finally {
    client.release();
  }
}

export async function duplicateRecipe(recipeId: string) {
  await requirePlatformAdmin();

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const recipeRes = await client.query(
      `
        SELECT *
        FROM recipes
        WHERE id = $1
        `,
      [recipeId],
    );

    const recipe = recipeRes.rows[0];

    if (!recipe) {
      throw new Error("Recipe not found");
    }

    const duplicated = await client.query(
      `
        INSERT INTO recipes (
          title,
          slug,
          short_description,
          content,
          youtube_url,
          youtube_video_id,
          thumbnail_url,
          category_id,
          status
        )
        VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9
        )
        RETURNING id
        `,
      [
        `${recipe.title} Copy`,
        `${recipe.slug}-copy-${Date.now()}`,
        recipe.short_description,
        recipe.content,
        recipe.youtube_url,
        recipe.youtube_video_id,
        recipe.thumbnail_url,
        recipe.category_id,
        "draft",
      ],
    );

    await client.query("COMMIT");

    revalidatePath("/platform/recipes");

    redirect(`/platform/recipes/${duplicated.rows[0].id}`);
  } catch (err) {
    await client.query("ROLLBACK");

    throw err;
  } finally {
    client.release();
  }
}

/* 



  // if (!title || !slug || !youtubeUrl || !categoryId) {
  //   return {
  //     success: false,
  //     error: "Missing required fields",
  //   };
  // }

  // const youtubeVideoId = extractYoutubeId(youtubeUrl as string);

  // if (!youtubeVideoId) {
  //   return {
  //     success: false,
  //     error: "Invalid YouTube URL",
  //   };
  // }
*/
