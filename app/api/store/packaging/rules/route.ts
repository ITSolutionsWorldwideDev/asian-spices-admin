// apps/admin/app/api/store/packaging/rules/route.ts

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/core/db";
import { getCurrentStoreAPI } from "@/lib/auth/guards";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      packaging_type_id,
      min_weight_kg,
      max_weight_kg,
      min_order_amount,
      max_order_amount,
      priority,
    } = body;

    const store = await getCurrentStoreAPI(req);

    if (!store?.id) {
      return NextResponse.json({ error: "Store not found" }, { status: 401 });
    }
    const storeId = store.id;

    if (!name || !packaging_type_id) {
      return NextResponse.json(
        {
          success: false,
          error: "Required context target parameters are missing.",
        },
        { status: 400 },
      );
    }

    // Explicitly parse and normalize numerical elements before DB integration injection execution
    const validatedPriority = parseInt(String(priority), 10);
    const parsedPriority = isNaN(validatedPriority) ? 10 : validatedPriority;

    const res = await pool.query(
      `
      INSERT INTO packaging_rules (
        name, packaging_type_id, min_weight_kg, max_weight_kg, 
        min_order_amount, max_order_amount, priority, store_id, is_active
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
      RETURNING *
      `,
      [
        name,
        packaging_type_id,
        Number(min_weight_kg) || 0,
        max_weight_kg === "" || max_weight_kg === null
          ? null
          : Number(max_weight_kg),
        Number(min_order_amount) || 0,
        max_order_amount === "" || max_order_amount === null
          ? null
          : Number(max_order_amount),
        parsedPriority,
        storeId,
      ],
    );

    return NextResponse.json({ success: true, data: res.rows[0] });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    const store = await getCurrentStoreAPI(req);

    if (!store?.id) {
      return NextResponse.json({ error: "Store not found" }, { status: 401 });
    }
    const storeId = store.id;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Context indicators mapping parameters missing.",
        },
        { status: 400 },
      );
    }

    // Verify ownership security parameters scope layout limits
    const result = await pool.query(
      "DELETE FROM packaging_rules WHERE id = $1 AND store_id = $2 RETURNING id",
      [id, storeId],
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Target rule not found or unowned by tenant" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 },
    );
  }
}
