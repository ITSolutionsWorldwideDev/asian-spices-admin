// /app/api/orders/[orderId]/events/route.ts

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/core/db";

export async function GET(req: NextRequest, { params }: any) {
  try {
    const { orderId } = await params;

    const { rows } = await pool.query(
      `
      SELECT 
        oe.*,
        s.name as store_name
      FROM order_events oe
      LEFT JOIN stores s ON s.id = oe.store_id
      WHERE oe.order_id = $1
      ORDER BY oe.created_at ASC
    `,
      [orderId]
    );

    return NextResponse.json({ success: true, events: rows });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}