// app/api/cron/order-timeout/route.ts

import { NextResponse } from "next/server";
import { pool } from "@/core/db";
// import {
//   assignNextStore,
//   isTimeoutExceeded,
//   logOrderEvent,
//   ORDER_EVENTS,
// } from "@/lib/order-routing";

import {
  assignNextStore,
  logOrderEvent,
  ORDER_EVENTS,
} from "@/core/order-routing";

// import { reassignAllocation } from "@/lib/allocation";

export async function GET(req: Request) {


  // const auth = req.headers.get("authorization");

  // if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
  //   return new Response("Unauthorized", { status: 401 });
  // }

  const client = await pool.connect();

  try {
    // 🔹 get pending allocations
    const { rows: allocations } = await client.query(`
      SELECT *
      FROM order_item_allocations
      WHERE status = 'pending'
        AND created_at < NOW() - INTERVAL '10 minutes'
    `);

    for (const allocation of allocations) {
      try {
        await client.query("BEGIN");

        // ❌ mark as rejected (timeout)
        await client.query(
          `
        UPDATE order_item_allocations
        SET status = 'rejected',
            responded_at = NOW()
        WHERE id = $1
      `,
          [allocation.id],
        );

        // 🔁 reassign remaining qty
        // await reassignAllocation(client, allocation.id);
        await assignNextStore(client, allocation.order_id);

        // 📝 log
        await logOrderEvent(client, {
          orderId: allocation.order_id,
          eventType: ORDER_EVENTS.REJECTED,
          storeId: allocation.store_id,
          message: "Auto rejected (timeout)",
        });

        await client.query("COMMIT");
      } catch (err) {
        await client.query("ROLLBACK");
        console.error("Allocation timeout processing failed:", {
          allocationId: allocation.id,
          error: err,
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    await client.query("ROLLBACK");
    return NextResponse.json({ error: "Cron failed" }, { status: 500 });
  } finally {
    client.release();
  }
}

/* export async function GET() {
  const client = await pool.connect();

  try {
    // 🔹 get all pending attempts
    const { rows: attempts } = await client.query(`
      SELECT 
        ora.*,
        o.id as order_id,
        o.created_at,
        s.id as store_id
      FROM order_routing_attempts ora
      JOIN store_orders o ON o.id = ora.order_id
      JOIN stores s ON s.id = ora.store_id
      WHERE ora.status = 'pending'
    `);

    for (const attempt of attempts) {
      const isExpired = await isTimeoutExceeded(client, attempt);

      if (!isExpired) continue;

      await client.query("BEGIN");

      // ❌ mark attempt rejected
      await client.query(
        `
        UPDATE order_routing_attempts
        SET status = 'rejected',
            responded_at = NOW()
        WHERE id = $1
      `,
        [attempt.id],
      );

      // increment rejection count
      await client.query(
        `
        UPDATE store_orders
        SET rejection_count = rejection_count + 1
        WHERE id = $1
      `,
        [attempt.order_id],
      );

      // 🔁 assign next store
      await assignNextStore(client, attempt.order_id);

      // 📝 log event
      await logOrderEvent(client, {
        orderId: attempt.order_id,
        eventType: ORDER_EVENTS.REJECTED,
        storeId: attempt.store_id,
        message: "Auto rejected (timeout exceeded)",
      });

      await client.query("COMMIT");
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    await client.query("ROLLBACK");
    return NextResponse.json({ error: "Cron failed" }, { status: 500 });
  } finally {
    client.release();
  }
} */
