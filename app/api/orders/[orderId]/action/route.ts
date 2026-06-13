// /app/api/orders/[orderId]/action/route.ts

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/core/db";
import { AppError } from "@/lib/errors";

import {
  assignNextStore,
  logOrderEvent,
  ORDER_EVENTS,
} from "@/core/order-routing";

const DEFAULT_STORE_ID = "afef3fd5-c31a-440a-ae56-99eca0b24359";

export async function POST(req: NextRequest, { params }: any) {
  const client = await pool.connect();

  try {
    const { action, storeId } = await req.json();
    const { orderId } = await params;

    await client.query("BEGIN");


    // lock order
    const { rows } = await client.query(
      `SELECT * FROM store_orders WHERE id = $1 FOR UPDATE`,
      [orderId]
    );

    const order = rows[0];
    if (!order) throw new Error("Order not found");

    // =====================
    // 🔁 REASSIGN
    // =====================

    if (action === "reassign") {

      await client.query(
        `UPDATE order_routing_attempts
         SET status = 'expired'
         WHERE order_id = $1 AND status = 'pending'`,
        [orderId]
      );

      await assignNextStore(client, orderId);

      await logOrderEvent(client, {
        orderId,
        // eventType: "admin_reassign",
        eventType: ORDER_EVENTS.ADMIN_REASSIGN,
        message: "Admin triggered reassign",
      });
    }

    // =====================
    // FORCE ASSIGN
    // =====================

    if (action === "force_assign") {
      await client.query(
        `
        UPDATE store_orders
        SET current_store_id = $1,
             routing_status = 'assigned'
        WHERE id = $2 AND 
        order_status NOT IN ('cancelled','fulfilled')
      `,
        [storeId, orderId],
      );

      await client.query(
        `INSERT INTO order_routing_attempts
         (order_id, store_id, attempt_number, status)
         VALUES ($1,$2,1,'forced')`,
        [orderId, storeId]
      );

      await logOrderEvent(client, {
        orderId,
        // eventType: "admin_force_assign",
        eventType: ORDER_EVENTS.ADMIN_FORCE_ASSIGN,
        storeId,
        message: "Admin force assigned store",
      });
    }

    if (action === "cancel") {
      await client.query(
        `
        UPDATE store_orders
        SET order_status = 'cancelled'
        WHERE id = $1
      `,
        [orderId],
      );

      await logOrderEvent(client, {
        orderId,
        // eventType: "cancelled",
        eventType: ORDER_EVENTS.CANCELLED,
        message: "Order cancelled by admin",
      });
    }

    await client.query("COMMIT");

    return NextResponse.json({ success: true });
  } catch (err) {
    await client.query("ROLLBACK");

    if (err instanceof AppError) {
      return NextResponse.json(
        {
          error: err.message,
          code: err.code,
        },
        { status: err.statusCode },
      );
    }

    console.error(err);
    return NextResponse.json(
      {
        error: "Something went wrong",
        code: "INTERNAL_ERROR",
      },
      { status: 500 },
    );
    
  } finally {
    client.release();
  }
}
