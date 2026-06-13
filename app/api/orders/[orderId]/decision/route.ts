// /app/api/orders/[orderId]/decision/route.ts

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/core/db";

import {
  assignNextStore,
  logOrderEvent,
  ORDER_EVENTS,
} from "@/core/order-routing";
import { getCurrentStoreAPI } from "@/lib/auth/guards";

const DEFAULT_STORE_ID = "afef3fd5-c31a-440a-ae56-99eca0b24359";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const client = await pool.connect();

  try {
    const store = await getCurrentStoreAPI(req);
    const storeId = store.id;

    const { action } = await req.json();
    const { orderId } = await params;

    await client.query("BEGIN");

    const { rows } = await client.query(
      `SELECT current_store_id FROM store_orders WHERE id = $1`,
      [orderId],
    );

    const order = rows[0];
    if (!order) throw new Error("Order not found");

    if (order.current_store_id !== storeId) {
      throw new Error("Unauthorized store action");
    }

    // if (rows[0].current_store_id !== storeId) {
    //   throw new Error("Unauthorized store action");
    // }

    // =====================
    // ✅ ACCEPT
    // =====================
    if (action === "accept") {
      await client.query(
        `UPDATE store_orders
         SET routing_status = 'accepted',
             updated_at = NOW()
         WHERE id = $1`,
        [orderId],
      );

      await client.query(
        `UPDATE order_routing_attempts
         SET status = 'accepted',
             responded_at = NOW()
         WHERE order_id = $1 AND store_id = $2 AND status = 'pending'`,
        [orderId, storeId],
      );

      await logOrderEvent(client, {
        orderId,
        eventType: ORDER_EVENTS.ACCEPTED,
        storeId,
        message: "Store accepted order",
      });
    }

    if (action === "reassign") {
      await assignNextStore(client, orderId);

      await logOrderEvent(client, {
        orderId,
        // eventType: "admin_reassign",
        eventType: ORDER_EVENTS.ADMIN_REASSIGN,
        message: "Admin triggered reassign",
      });
    }

    if (action === "force_default") {
      await client.query(
        `UPDATE store_orders
         SET current_store_id = $1,
         routing_status = 'assigned'
         WHERE id = $2`,
        [DEFAULT_STORE_ID, orderId],
      );

      await logOrderEvent(client, {
        orderId,
        // eventType: "admin_reassign",
        eventType: ORDER_EVENTS.ADMIN_REASSIGN,
        message: "Admin triggered reassign",
      });
    }

    if (action === "approve") {
      await client.query(
        `
        UPDATE store_orders
        SET order_status = 'accepted',
            routing_status = 'accepted',
            updated_at = NOW()
        WHERE id = $1
        `,
        [orderId],
      );

      await logOrderEvent(client, {
        orderId,
        eventType: ORDER_EVENTS.ACCEPTED,
        message: "Store accepted the order",
      });
    }

    if (action === "reject") {
      // mark attempt rejected
      await client.query(
        `
        UPDATE order_routing_attempts
        SET status = 'rejected',
            responded_at = NOW()
        WHERE order_id = $1
          AND store_id = $2
          AND status = 'pending'
        `,
        [orderId,storeId],
      );

      // increment rejection count
      await client.query(
        `
        UPDATE store_orders
        SET rejection_count = rejection_count + 1
        WHERE id = $1
        `,
        [orderId],
      );

      await logOrderEvent(client, {
        orderId,
        eventType: ORDER_EVENTS.REJECTED,
        storeId,
        message: "Store rejected order",
      });

      // await logOrderEvent(client, {
      //   orderId,
      //   eventType: ORDER_EVENTS.REJECTED,
      //   message: "Store rejected the order",
      // });

      // 🔥 assign next store
      await assignNextStore(client, orderId);
    }

    await client.query("COMMIT");

    return NextResponse.json({ success: true });
  } catch (err) {
    await client.query("ROLLBACK");
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  } finally {
    client.release();
  }
}

/* export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { action } = await req.json();

    const { orderId } = await params;

    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const status = action === "approve" ? "accepted" : "rejected";

    await pool.query(
      `UPDATE store_orders
       SET order_status = $1,
           updated_at = NOW()
       WHERE id = $2`,
      [status, orderId]
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to update order status" },
      { status: 500 }
    );
  }
} */
