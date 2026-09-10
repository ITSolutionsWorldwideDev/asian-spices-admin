// app/api/currencies/[id]/route.ts

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
  const client = await pool.connect();

  try {
    const { id } = await params;
    await client.query("BEGIN");

    // Best-effort unlink so hard delete can succeed
    const cleanupSql = [
      `UPDATE countries SET currency_id = NULL WHERE currency_id = $1`,
      `UPDATE store_settings SET currency_id = NULL WHERE currency_id = $1`,
      `DELETE FROM currency_rates WHERE base_currency_id = $1 OR target_currency_id = $1`,
    ];

    for (const sql of cleanupSql) {
      try {
        await client.query(sql, [id]);
      } catch (err: any) {
        // Ignore missing table/column
        if (err?.code === "42P01" || err?.code === "42703") continue;
        throw err;
      }
    }

    await client.query(`DELETE FROM currencies WHERE id = $1`, [id]);
    await client.query("COMMIT");

    return NextResponse.json({ success: true });
  } catch (err: any) {
    await client.query("ROLLBACK");
    console.error("DELETE currency error:", err);
    return NextResponse.json(
      { error: err.message || "Delete failed" },
      { status: 500 },
    );
  } finally {
    client.release();
  }
}
