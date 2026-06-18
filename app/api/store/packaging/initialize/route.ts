// app/api/store/packaging/initialize/route.ts
import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/core/db";
import { getCurrentStoreAPI } from "@/lib/auth/guards";

export async function POST(req: NextRequest) {
  try {
    const store = await getCurrentStoreAPI(req);

    if (!store?.id) {
      return NextResponse.json({ error: "Store not found" }, { status: 401 });
    }
    const storeId = store.id;

    const { packaging_type_id, initial_quantity } = await req.json();

    if (!packaging_type_id) {
      return NextResponse.json(
        { success: false, error: "Missing fields" },
        { status: 400 },
      );
    }

    // ON CONFLICT ensures we don't crash if they try to add it twice
    await pool.query(
      `INSERT INTO store_packaging_inventory (store_id, packaging_type_id, quantity_available, minimum_threshold)
       VALUES ($1, $2, $3, 10)
       ON CONFLICT (store_id, packaging_type_id) 
       DO UPDATE SET updated_at = NOW()
       RETURNING *`,
      [storeId, packaging_type_id, parseInt(initial_quantity, 10) || 0],
    );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 },
    );
  }
}
