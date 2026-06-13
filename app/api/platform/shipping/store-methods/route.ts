// apps/admin/app/api/platform/shipping/store-methods/route.ts

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/core/db";
import { requirePlatformAdmin } from "@/lib/auth/guards";

export async function POST(req: NextRequest) {
  await requirePlatformAdmin();

  const { storeId, methodId, is_enabled } = await req.json();

  const { rows } = await pool.query(
    `
    INSERT INTO store_shipping_methods 
      (store_id, method_id, is_enabled)
    VALUES ($1, $2, $3)
    ON CONFLICT ON CONSTRAINT store_shipping_methods_store_method_unique
    DO UPDATE SET
      is_enabled = EXCLUDED.is_enabled
    RETURNING *
    `,
    [storeId, methodId, is_enabled]
  );

  return NextResponse.json({ assignment: rows[0] });
}