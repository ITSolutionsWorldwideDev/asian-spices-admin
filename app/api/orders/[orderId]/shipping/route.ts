// /app/api/orders/[orderId]/shipping/route.ts

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/core/db";
import { getCurrentStoreAPI } from "@/lib/auth/guards";

const VALID_STATUSES = [
  "pending",
  "processing",
  "shipped",
  "out_for_delivery",
  "delivered",
  "cancelled",
];

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const client = await pool.connect();

  try {
    const { status } = await req.json();

    const store = await getCurrentStoreAPI(req);
    const storeId = store.id;

    if (!storeId) {
      return NextResponse.json(
        { error: "Store not resolved" },
        { status: 400 },
      );
    }

    const { orderId } = await params;

    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    await client.query("BEGIN");

    // Optional: prevent updating cancelled orders
    const { rows } = await client.query(
      `SELECT fulfillment_status FROM store_orders WHERE id = $1 FOR UPDATE`,
      [orderId],
    );

    if (!rows.length) {
      throw new Error("Order not found");
    }

    if (rows[0].fulfillment_status === "cancelled") {
      throw new Error("Cannot update cancelled order");
    }

    if (rows[0].fulfillment_status === "delivered") {
      throw new Error("Order already delivered");
    }

    await client.query(
      `UPDATE store_orders
       SET fulfillment_status = $1,
           updated_at = now()
       WHERE id = $2`,
      [status, orderId],
    );

    await client.query("COMMIT");

    return NextResponse.json({ success: true });
  } catch (err: any) {
    await client.query("ROLLBACK");

    return NextResponse.json({ error: err.message }, { status: 400 });
  } finally {
    client.release();
  }
}
