// /app/api/orders/[orderId]/fulfill/route.ts

// apps/admin/app/api/orders/[orderId]/fulfill/route.ts
import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/core/db";
import {
  resolveOrderStatus,
  assignNextStore,
  logOrderEvent,
  ORDER_EVENTS,
} from "@/core/order-routing";
import { getCurrentStoreAPI } from "@/lib/auth/guards";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const client = await pool.connect();

  try {
    const store = await getCurrentStoreAPI(req);
    const storeId = store.id;

    const { orderId } = await params;
    const { action, items } = await req.json(); // actions: "full" | "partial" | "reject"

    await client.query("BEGIN");

    // 🔒 Lock current partner store allocations
    const { rows: allocations } = await client.query(
      `SELECT * FROM order_item_allocations
       WHERE order_id = $1 AND store_id = $2
       FOR UPDATE`,
      [orderId, storeId]
    );

    if (!allocations.length) {
      throw new Error("No allocations found matching this store instance.");
    }

    // ==========================================
    // ✅ CASE 1: FULL FULFILLMENT
    // ==========================================
    if (action === "full") {
      for (const alloc of allocations) {
        // Reduce stock in store_products
        await client.query(
          `UPDATE store_products
           SET quantity = quantity - $1
           WHERE id = (
             SELECT product_id FROM store_order_items WHERE id = $2
           )`,
          [alloc.allocated_quantity, alloc.order_item_id]
        );

        // Mark individual allocation line item as fulfilled
        await client.query(
          `UPDATE order_item_allocations
           SET fulfilled_quantity = allocated_quantity,
               status = 'fulfilled'
           WHERE id = $1`,
          [alloc.id]
        );

        // Increment the physical order item fulfilled threshold counter
        await client.query(
          `UPDATE store_order_items
           SET fulfilled_quantity = COALESCE(fulfilled_quantity, 0) + $1
           WHERE id = $2`,
          [alloc.allocated_quantity, alloc.order_item_id]
        );
      }

      await logOrderEvent(client, {
        orderId,
        eventType: ORDER_EVENTS.ACCEPTED,
        storeId,
        message: "Partner store accepted and fulfilled complete order capacity",
      });
    }

    // ==========================================
    // ⚠️ CASE 2: PARTIAL FULFILLMENT
    // ==========================================
    if (action === "partial") {
      for (const alloc of allocations) {
        // Find matching item sent from frontend using the unique allocation reference
        const userItem = items?.find(
          (i: any) => i.allocation_id === alloc.id || i.order_item_id === alloc.order_item_id
        );

        // Safe evaluation of quantity targets
        const targetQty = userItem !== undefined ? Number(userItem.fulfilled_quantity) : alloc.allocated_quantity;
        const fulfillQty = Math.max(0, Math.min(targetQty, alloc.allocated_quantity));

        // Deduct only what can actually be processed from product stock
        await client.query(
          `UPDATE store_products
           SET quantity = quantity - $1
           WHERE id = (
             SELECT product_id FROM store_order_items WHERE id = $2
           )`,
          [fulfillQty, alloc.order_item_id]
        );

        // Calculate line string enum code status maps
        const allocationStatus = fulfillQty === 0 ? "rejected" : fulfillQty < alloc.allocated_quantity ? "partial" : "fulfilled";

        await client.query(
          `UPDATE order_item_allocations
           SET fulfilled_quantity = $1,
               status = $2
           WHERE id = $3`,
          [fulfillQty, allocationStatus, alloc.id]
        );

        await client.query(
          `UPDATE store_order_items
           SET fulfilled_quantity = COALESCE(fulfilled_quantity, 0) + $1
           WHERE id = $2`,
          [fulfillQty, alloc.order_item_id]
        );
      }

      await logOrderEvent(client, {
        orderId,
        eventType: ORDER_EVENTS.PARTIAL,
        storeId,
        message: "Partner store registered partial fulfillment criteria",
      });

      // 🔁 Automatically route remaining or unfulfilled line balances to next store candidate
      await assignNextStore(client, orderId);
    }

    // ==========================================
    // 🛑 CASE 3: COMPLETE REJECTION / CANCELLATION
    // ==========================================
    if (action === "reject") {
      for (const alloc of allocations) {
        await client.query(
          `UPDATE order_item_allocations
           SET fulfilled_quantity = 0,
               status = 'rejected'
           WHERE id = $1`,
          [alloc.id]
        );
      }

      await logOrderEvent(client, {
        orderId,
        eventType: ORDER_EVENTS.REJECTED,
        storeId,
        message: "Partner store rejected allocation completely post-acceptance",
      });

      // Pass the remaining items down the global SaaS routing queue
      await assignNextStore(client, orderId);
    }

    // Recalculate parent orders tables header status configurations strings
    await resolveOrderStatus(client, orderId);

    await client.query("COMMIT");
    return NextResponse.json({ success: true });
    
  } catch (err: any) {
    await client.query("ROLLBACK");
    return NextResponse.json({ error: err.message }, { status: 400 });
  } finally {
    client.release();
  }
}

/* import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/core/db";
import {
  resolveOrderStatus,
  assignNextStore,
  logOrderEvent,
  ORDER_EVENTS,
} from "@/core/order-routing";
import { getCurrentStoreAPI } from "@/lib/auth/guards";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const client = await pool.connect();

  try {
    const store = await getCurrentStoreAPI(req);
    const storeId = store.id;

    const { orderId } = await params;
    const { action, items } = await req.json();

    await client.query("BEGIN");

    // 🔒 lock allocations
    const { rows: allocations } = await client.query(
      `SELECT * FROM order_item_allocations
       WHERE order_id = $1 AND store_id = $2
       FOR UPDATE`,
      [orderId, storeId]
    );

    if (!allocations.length) {
      throw new Error("No allocations for this store");
    }

    // =====================
    // ✅ FULL
    // =====================
    if (action === "full") {
      for (const alloc of allocations) {
        await client.query(
          `UPDATE store_products
           SET quantity = quantity - $1
           WHERE id = (
             SELECT product_id FROM store_order_items WHERE id = $2
           )`,
          [alloc.allocated_quantity, alloc.order_item_id]
        );

        await client.query(
          `UPDATE order_item_allocations
           SET fulfilled_quantity = allocated_quantity,
               status = 'fulfilled'
           WHERE id = $1`,
          [alloc.id]
        );

        await client.query(
          `UPDATE store_order_items
           SET fulfilled_quantity = COALESCE(fulfilled_quantity,0) + $1
           WHERE id = $2`,
          [alloc.allocated_quantity, alloc.order_item_id]
        );
      }

      await logOrderEvent(client, {
        orderId,
        eventType: ORDER_EVENTS.ACCEPTED,
        storeId,
        message: "Full fulfillment",
      });
    }

    // =====================
    // ⚠️ PARTIAL
    // =====================
    if (action === "partial") {
      for (const alloc of allocations) {
        const userItem = items?.find(
          (i: any) => i.allocation_id === alloc.id
        );

        const fulfillQty = userItem
          ? Math.min(userItem.quantity, alloc.allocated_quantity)
          : 0;

        await client.query(
          `UPDATE store_products
           SET quantity = quantity - $1
           WHERE id = (
             SELECT product_id FROM store_order_items WHERE id = $2
           )`,
          [fulfillQty, alloc.order_item_id]
        );

        await client.query(
          `UPDATE order_item_allocations
           SET fulfilled_quantity = $1,
               status = CASE
                 WHEN $1 = 0 THEN 'rejected'
                 WHEN $1 < allocated_quantity THEN 'partial'
                 ELSE 'fulfilled'
               END
           WHERE id = $2`,
          [fulfillQty, alloc.id]
        );

        await client.query(
          `UPDATE store_order_items
           SET fulfilled_quantity = COALESCE(fulfilled_quantity,0) + $1
           WHERE id = $2`,
          [fulfillQty, alloc.order_item_id]
        );
      }

      await logOrderEvent(client, {
        orderId,
        eventType: ORDER_EVENTS.PARTIAL,
        storeId,
        message: "Partial fulfillment",
      });

      // 🔁 route remaining items
      await assignNextStore(client, orderId);
    }

    await resolveOrderStatus(client, orderId);

    await client.query("COMMIT");

    return NextResponse.json({ success: true });
  } catch (err: any) {
    await client.query("ROLLBACK");
    return NextResponse.json({ error: err.message }, { status: 400 });
  } finally {
    client.release();
  }
} */