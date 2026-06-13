// /app/api/recipe-tags/assign/route.ts

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/core/db";
import { requirePlatformAdmin } from "@/lib/auth/guards";

/**
 * Assign tags to a recipe (replaces existing)
 */
export async function POST(req: NextRequest) {
  try {
    await requirePlatformAdmin();

    const body = await req.json();
    const { recipe_id, tag_ids } = body as {
      recipe_id: string;
      tag_ids: string[];
    };

    if (!recipe_id) {
      return NextResponse.json(
        { success: false, error: "recipe_id required" },
        { status: 400 },
      );
    }

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // remove existing
      await client.query(
        `DELETE FROM recipe_recipe_tags WHERE recipe_id = $1`,
        [recipe_id],
      );

      // insert new
      if (tag_ids?.length) {
        const values = tag_ids
          .map((_, i) => `($1, $${i + 2})`)
          .join(",");

        await client.query(
          `INSERT INTO recipe_recipe_tags (recipe_id, tag_id)
           VALUES ${values}`,
          [recipe_id, ...tag_ids],
        );
      }

      await client.query("COMMIT");

      return NextResponse.json({
        success: true,
        message: "Tags assigned successfully",
      });
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}