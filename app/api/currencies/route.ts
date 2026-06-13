// apps/admin/app/api/currencies/route.ts

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/core/db";
// import { getCurrentStoreAPI } from "@/lib/auth/guards";

export async function GET() {
  const client = await pool.connect();

  try {
    const { rows } = await client.query(`
      SELECT id, code, name, symbol, decimal_places,is_base
      FROM currencies
      WHERE is_active = true
      ORDER BY code ASC
    `);

    return NextResponse.json({ items: rows });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}


export async function POST(req: NextRequest) {
  try {
    const { code, name, symbol } = await req.json();

    const { rows } = await pool.query(
      `
      INSERT INTO currencies (code, name, symbol)
      VALUES ($1, $2, $3)
      RETURNING *
      `,
      [code.toUpperCase(), name, symbol]
    );

    return NextResponse.json(rows[0]);
  } catch (err) {
    return NextResponse.json({ error: "Create failed" }, { status: 500 });
  }
}