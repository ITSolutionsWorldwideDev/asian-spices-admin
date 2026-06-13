// api/shipping/confirm-booking/route.ts

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/core/db";
import { getCurrentStoreAPI } from "@/lib/auth/guards";

export async function POST(req: NextRequest) {
  const client = await pool.connect();

  try {
    const store = await getCurrentStoreAPI(req);
    const storeId = store.id;

    const { orderId } = await req.json();

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: "orderId is required" },
        { status: 400 },
      );
    }

    console.log('confirm-booking // storeId === ',storeId);

    await client.query("BEGIN");

    // -----------------------------
    // 1. Get shipment
    // -----------------------------
    const shipmentRes = await client.query(
      `
      SELECT *
      FROM shipments
      WHERE order_id = $1 AND store_id = $2
      `,
      [orderId, storeId],
    );

    const shipment = shipmentRes.rows[0];

    console.log('confirm-booking // shipment === ',shipment);

    if (!shipment) {
      return NextResponse.json(
        { success: false, error: "Shipment not found" },
        { status: 404 },
      );
    }

    // -----------------------------
    // 2. Optional: prevent double booking
    // -----------------------------

    const orderCheck = await client.query(
      `
      SELECT o.shipping_paid, o.shipping_status
      FROM store_orders o
      INNER JOIN order_item_allocations oia ON oia.order_id = o.id
      WHERE o.id = $1 AND oia.store_id = $2
      `,
      [orderId, storeId],
    );

    const order = orderCheck.rows[0];

    console.log('confirm-booking // order === ',order);

    /* const orderCheck = await client.query(
      `
      SELECT shipping_paid, shipping_status
      FROM store_orders
      WHERE id = $1 AND store_id = $2
      `,
      [orderId, storeId],
    );

    const order = orderCheck.rows[0]; */

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order record missing allocation paths" },
        { status: 404 },
      );
    }

    if (order.shipping_paid === true || order.shipping_paid === "true") {
      return NextResponse.json(
        { success: false, error: "Freight allocations records already locked" },
        { status: 400 },
      );
    }

    // -----------------------------
    // 3. Update shipment status
    // -----------------------------

    const rawResponse = shipment.raw_response || {};
    const paymentUrl = rawResponse?.shipment?.url || null;

    await client.query(
      `
      UPDATE shipments
      SET
        status = 'booked',
        updated_at = NOW()
      WHERE id = $1
      `,
      [shipment.id],
    );;

    // -----------------------------
    // 4. Update order (IMPORTANT)
    // -----------------------------
    
    const updateResult = await client.query(
      `
      UPDATE store_orders
      SET
        shipping_paid = true,
        shipping_status = 'booked',
        payment_url = COALESCE($1, payment_url),
        updated_at = NOW()
      WHERE id = $2
      RETURNING id, shipping_paid, shipping_status
      `,
      [paymentUrl, orderId],
    );

    console.log('confirm-booking // Database Row Affected Verification:', updateResult.rowCount);

    await client.query("COMMIT");

    return NextResponse.json({
      success: true,
      message: "Shipment marked as booked successfully",
      data: {
        orderId,
        shipping_status: "booked",
        shipping_paid: true,
        paymentUrl,
      },
    });
  } catch (err: any) {
    await client.query("ROLLBACK");

    console.error("confirm-booking error:", err);

    return NextResponse.json(
      { success: false, error: err.message || "Server error" },
      { status: 500 },
    );
  } finally {
    client.release();
  }
}