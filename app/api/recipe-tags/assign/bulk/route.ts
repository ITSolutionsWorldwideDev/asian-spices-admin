// /app/api/recipe-tags/assign/bulk/route.ts

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/core/db";
import { requirePlatformAdmin } from "@/lib/auth/guards";

export async function POST(req: NextRequest) {
  try {
    await requirePlatformAdmin();

    const { recipe_ids, tag_ids } = await req.json();

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      for (const recipeId of recipe_ids) {
        await client.query(
          `DELETE FROM recipe_recipe_tags WHERE recipe_id = $1`,
          [recipeId],
        );

        for (const tagId of tag_ids) {
          await client.query(
            `INSERT INTO recipe_recipe_tags (recipe_id, tag_id)
             VALUES ($1, $2)`,
            [recipeId, tagId],
          );
        }
      }

      await client.query("COMMIT");

      return NextResponse.json({
        success: true,
        message: "Bulk tags applied",
      });
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e.message },
      { status: 500 },
    );
  }
}
