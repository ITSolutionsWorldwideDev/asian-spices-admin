// app/api/customers/[customerId]/orders/route.ts

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/core/db";
import { getCurrentStoreAPI } from "@/lib/auth/guards";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ customerId: string }> }
) {
  try {
    const store = await getCurrentStoreAPI(req);
    const { customerId } = await params;

    const orders = await pool.query(
      `
      SELECT
        id,
        order_number,
        order_type,
        subtotal,
        tax_amount,
        discount_amount,
        shipping_amount,
        total_amount,
        payment_status,
        fulfillment_status,
        created_at
      FROM store_orders
      WHERE customer_id = $1
        AND store_id = $2
      ORDER BY created_at DESC
      `,
      [customerId, store.id]
    );

    return NextResponse.json({ items: orders.rows });

  } catch (error) {
    console.error("CUSTOMER ORDERS ERROR:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

/* export async function GET(
  _: Request,
  { params }: { params: Promise<{ customerId: string }> }
) {
  const { customerId } = await params;

  try {
    const orders = await pool.query(
      `SELECT order_id, order_date, status, total_amount, payment_reference
       FROM orders
       WHERE customer_id = $1
       ORDER BY order_date DESC`,
      [customerId]
    );

    return NextResponse.json({ items: orders.rows });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Failed to fetch orders", detail: e.message },
      { status: 500 }
    );
  }
} */
