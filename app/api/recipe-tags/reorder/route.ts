// /app/api/recipe-tags/reorder/route.ts

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/core/db";
import { requirePlatformAdmin } from "@/lib/auth/guards";

export async function POST(req: NextRequest) {
  try {
    await requirePlatformAdmin();

    const { items } = await req.json();

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      for (const item of items) {
        await client.query(
          `UPDATE recipe_tags
           SET sort_order = $1
           WHERE id = $2`,
          [item.sort_order, item.id],
        );
      }

      await client.query("COMMIT");

      return NextResponse.json({
        success: true,
        message: "Order updated",
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
