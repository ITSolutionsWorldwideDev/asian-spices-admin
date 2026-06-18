// app/api/currencies/convert/route.ts

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/core/db";

export async function POST(req: NextRequest) {
  try {
    const { amount, from, to } = await req.json();

    if (!amount || !from || !to) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { rows } = await pool.query(
      `
      SELECT cr.rate
      FROM currency_rates cr
      JOIN currencies c1 ON c1.id = cr.base_currency_id
      JOIN currencies c2 ON c2.id = cr.target_currency_id
      WHERE c1.code = $1 AND c2.code = $2
      `,
      [from, to]
    );

    const rate = rows.length ? Number(rows[0].rate) : 1;

    const converted = Number(amount) / rate;

    return NextResponse.json({
      base_amount: amount,
      converted_amount: converted,
      rate,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Conversion failed" }, { status: 500 });
  }
}