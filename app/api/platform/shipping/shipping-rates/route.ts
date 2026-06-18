// app/api/platform/shipping/shipping-rates/route.ts

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/core/db";
import { requirePlatformAdmin } from "@/lib/auth/guards";

// GET by method
export async function GET(req: NextRequest) {
  await requirePlatformAdmin();

  const methodId = req.nextUrl.searchParams.get("methodId");

  const { rows } = await pool.query(
    `
    SELECT * FROM shipping_rates
    WHERE method_id = $1
    ORDER BY created_at DESC
    `,
    [methodId]
  );

  return NextResponse.json({ rates: rows });
}

// CREATE
export async function POST(req: NextRequest) {
  await requirePlatformAdmin();

  const body = await req.json();

  const { rows } = await pool.query(
    `
    INSERT INTO shipping_rates
      (method_id, country, min_weight, max_weight, price)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
    `,
    [
      body.method_id,
      body.country,
      body.min_weight,
      body.max_weight,
      body.price,
    ]
  );

  return NextResponse.json({ rate: rows[0] });
}