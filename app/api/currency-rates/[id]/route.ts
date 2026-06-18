// app/api/currency-rates/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/core/db";

// ----------------- PUT: Update rate -----------------
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const { rate } = await req.json();
    const { rows } = await pool.query(
      `
      UPDATE currency_rates
      SET rate = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `,
      [rate, id],
    );

    if (!rows[0]) {
      return NextResponse.json({ error: "Rate not found" }, { status: 404 });
    }

    return NextResponse.json(rows[0]);
  } catch (err) {
    console.error("PUT currency rate error:", err);
    return NextResponse.json(
      { error: "Failed to update rate" },
      { status: 500 },
    );
  }
}

// ----------------- DELETE: Delete rate -----------------
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { rowCount } = await pool.query(
      `DELETE FROM currency_rates WHERE id = $1`,
      [id],
    );

    if (!rowCount) {
      return NextResponse.json({ error: "Rate not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE currency rate error:", err);
    return NextResponse.json(
      { error: "Failed to delete rate" },
      { status: 500 },
    );
  }
}
