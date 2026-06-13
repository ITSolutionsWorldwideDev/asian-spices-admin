// apps/admin/app/api/currency-rates/route.ts

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/core/db";

// ----------------- GET: List all rates -----------------
export async function GET() {
  try {
    const { rows } = await pool.query(`
      SELECT
        cr.id,
        cr.rate,
        cr.updated_at,
        bc.code AS base_currency_code,
        bc.symbol AS base_currency_symbol,
        tc.code AS target_currency_code,
        tc.symbol AS target_currency_symbol
      FROM currency_rates cr
      JOIN currencies bc ON cr.base_currency_id = bc.id
      JOIN currencies tc ON cr.target_currency_id = tc.id
      ORDER BY bc.code, tc.code
    `);

    return NextResponse.json({ items: rows });
  } catch (err) {
    console.error("GET currency rates error:", err);
    return NextResponse.json(
      { error: "Failed to fetch rates" },
      { status: 500 },
    );
  }
}

// ----------------- POST: Create / Upsert rate -----------------
export async function POST(req: NextRequest) {
  try {
    const { base_currency_code, target_currency_code, rate } = await req.json();

    if (!base_currency_code || !target_currency_code || rate == null) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Get currency IDs
    const { rows: baseRows } = await pool.query(
      `SELECT id FROM currencies WHERE code = $1`,
      [base_currency_code],
    );
    const { rows: targetRows } = await pool.query(
      `SELECT id FROM currencies WHERE code = $1`,
      [target_currency_code],
    );

    if (!baseRows[0] || !targetRows[0]) {
      return NextResponse.json(
        { error: "Invalid currency code" },
        { status: 400 },
      );
    }

    const baseId = baseRows[0].id;
    const targetId = targetRows[0].id;

    const { rows } = await pool.query(
      `
      INSERT INTO currency_rates (base_currency_id, target_currency_id, rate)
      VALUES ($1, $2, $3)
      ON CONFLICT (base_currency_id, target_currency_id)
      DO UPDATE SET rate = EXCLUDED.rate, updated_at = NOW()
      RETURNING *
    `,
      [baseId, targetId, rate],
    );

    return NextResponse.json(rows[0]);
  } catch (err) {
    console.error("POST currency rate error:", err);
    return NextResponse.json({ error: "Failed to save rate" }, { status: 500 });
  }
}