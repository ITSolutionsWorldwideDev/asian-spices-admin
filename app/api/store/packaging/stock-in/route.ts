// app/api/store/packaging/stock-in/route.ts

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/core/db";
import { assignPackagingToStore } from "@/core/packaging-service";
import { getCurrentStoreAPI } from "@/lib/auth/guards";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { packagingTypeId, quantity, minimumThreshold } = body;

  const store = await getCurrentStoreAPI(req);

  if (!store?.id) {
    return NextResponse.json({ error: "Store not found" }, { status: 401 });
  }
  const storeId = store.id;

  if (!packagingTypeId || !quantity) {
    return NextResponse.json(
      { error: "Missing required payload variables" },
      { status: 400 },
    );
  }

  const client = await pool.connect();
  try {
    // Execute atomic upsert query through your service engine module
    const inventoryRecord = await assignPackagingToStore(client, {
      storeId,
      packagingTypeId,
      quantity: Number(quantity),
      minimumThreshold: Number(minimumThreshold || 10),
    });

    return NextResponse.json({ success: true, inventoryRecord });
  } catch (error: any) {
    console.error(
      "Failed handling package inventory assignment update:",
      error,
    );
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}
