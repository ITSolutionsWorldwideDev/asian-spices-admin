// apps/admin/app/api/platform/shipping/shipping-methods/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/core/db";
import { requirePlatformAdmin } from "@/lib/auth/guards";

// UPDATE
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await requirePlatformAdmin();

  const body = await req.json();
  const { id } = await params;

  const { rows } = await pool.query(
    `
    UPDATE shipping_methods
    SET 
      name = $1,
      code = $2,
      is_active = $3,
      updated_at = NOW()
    WHERE id = $4
    RETURNING *
    `,
    [body.name, body.code, body.is_active, id],
  );

  return NextResponse.json({ method: rows[0] });
}

// DELETE
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await requirePlatformAdmin();
  const { id } = await params;

  await pool.query(`DELETE FROM shipping_methods WHERE id = $1`, [id]);

  return NextResponse.json({ success: true });
}
