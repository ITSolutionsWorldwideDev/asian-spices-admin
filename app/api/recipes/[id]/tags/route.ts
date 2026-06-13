// /app/api/recipes/[id]/tags/route.ts

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/core/db";
import { requirePlatformAdmin } from "@/lib/auth/guards";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    await requirePlatformAdmin();

    const { rows } = await pool.query(
      `
      SELECT t.*
      FROM recipe_tags t
      INNER JOIN recipe_recipe_tags rt ON rt.tag_id = t.id
      WHERE rt.recipe_id = $1
      ORDER BY t.name ASC
      `,
      [id],
    );

    return NextResponse.json({
      success: true,
      items: rows,
    });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e.message },
      { status: 500 },
    );
  }
}
