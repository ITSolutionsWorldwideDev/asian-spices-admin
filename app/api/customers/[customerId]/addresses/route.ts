// apps\admin\app\api\customers\[customerId]\addresses\route.ts

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/core/db";

type Params = Promise<{ customerId: string }>;

export async function POST(
  req: NextRequest,
  { params }: { params: Params }
) {
  const { customerId } = await params;
  const body = await req.json();

  const result = await pool.query(
    `
    INSERT INTO store_customer_addresses (
      customer_id, store_id, label, address_line1, address_line2, city, state, postal_code, country, is_default
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
    RETURNING *
    `,
    [
      customerId,
      body.store_id, // enforce store_id from auth/session
      body.label,
      body.address_line1,
      body.address_line2,
      body.city,
      body.state,
      body.postal_code,
      body.country,
      body.is_default || false,
    ]
  );

  return NextResponse.json({ address: result.rows[0] });
}