// app/api/store/packaging/route.ts

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/core/db";
import { getStorePackagingInventory } from "@/core/packaging-service";
import { getCurrentStoreAPI } from "@/lib/auth/guards";

export async function GET(req: NextRequest) {
  // Extract tenant or store context from headers, session, or query parameters
  //   const { searchParams } = new URL(req.url);
  //   const storeId = searchParams.get("storeId");

  const store = await getCurrentStoreAPI(req);

  if (!store?.id) {
    return NextResponse.json({ error: "Store not found" }, { status: 401 });
  }
  const storeId = store.id;

  const client = await pool.connect();
  try {
    const inventory = await getStorePackagingInventory(client, storeId);
    return NextResponse.json({ inventory });
  } catch (error: any) {
    console.error("Failed to parse store packaging rows:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}
