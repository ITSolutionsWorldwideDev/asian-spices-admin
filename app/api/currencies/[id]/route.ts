// apps/admin/app/api/currencies/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/core/db";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { code, name, symbol, status } = await req.json();

    const { id } = await params;

    const { rows } = await pool.query(
      `
      UPDATE currencies
      SET code = $1,
          name = $2,
          symbol = $3,
          status = $4,
          updated_at = NOW()
      WHERE id = $5
      RETURNING *
      `,
      [code, name, symbol, status, id],
    );

    return NextResponse.json(rows[0]);
  } catch {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    await pool.query(`DELETE FROM currencies WHERE id = $1`, [id]);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
