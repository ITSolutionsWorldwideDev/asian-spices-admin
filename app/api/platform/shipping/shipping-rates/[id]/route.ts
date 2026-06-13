// apps/admin/app/api/platform/shipping/shipping-rates/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/core/db";
import { requirePlatformAdmin } from "@/lib/auth/guards";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await requirePlatformAdmin();

  const body = await req.json();
  const { id } = await params;

  const { rows } = await pool.query(
    `
    UPDATE shipping_rates
    SET 
      price = $1,
      max_weight = $2,
      updated_at = NOW()
    WHERE id = $3
    RETURNING *
    `,
    [body.price, body.max_weight, id]
  );

  return NextResponse.json({ rate: rows[0] });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await requirePlatformAdmin();
  const { id } = await params;

  await pool.query(
    `DELETE FROM shipping_rates WHERE id = $1`,
    [id]
  );

  return NextResponse.json({ success: true });
}