// app/api/store/returns/route.ts

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/core/db";
import { getCurrentStoreAPI } from "@/lib/auth/guards";
import { sendReturnStatusUpdateEmail } from "@/core/email-templates";

// 1️⃣ GET: Fetch specific store return allocations
export async function GET(req: NextRequest) {
  try {
    const store = await getCurrentStoreAPI(req);
    const storeId = store?.id;

    if (!storeId) {
      return NextResponse.json(
        { error: "Store context missing or unauthorized." },
        { status: 400 },
      );
    }

    const query = `
      SELECT 
        sra.id as allocation_id,
        sra.return_quantity,
        sra.status,
        r.return_number,
        r.id as return_id,
        o.order_number,
        p.name as product_name
      FROM store_return_allocations sra
      JOIN store_order_returns r ON r.id = sra.return_id
      JOIN store_orders o ON o.id = r.order_id
      JOIN store_products p ON p.id = sra.product_id
      WHERE sra.store_id = $1
      ORDER BY r.created_at DESC;
    `;

    const { rows } = await pool.query(query, [storeId]);
    return NextResponse.json({ allocations: rows });
  } catch (error: any) {
    console.error("Store returns query breakdown:", error);
    return NextResponse.json(
      { error: "Failed to load store node allocations" },
      { status: 500 },
    );
  }
}

// 2️⃣ PUT: Process individual item intake inspections
export async function PUT(req: NextRequest) {
  try {
    const store = await getCurrentStoreAPI(req);
    const storeId = store?.id;

    if (!storeId) {
      return NextResponse.json(
        { error: "Store scope contextual resolution failure." },
        { status: 401 },
      );
    }

    const body = await req.json();
    const { allocationId, resolution } = body; // 'received' or 'damaged'

    if (!allocationId || !["received", "damaged"].includes(resolution)) {
      return NextResponse.json(
        { error: "Missing payload mutation definitions." },
        { status: 400 },
      );
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Verify ownership and record availability
      const verifyQuery = `
        SELECT status, return_id, product_id, return_quantity 
        FROM store_return_allocations 
        WHERE id = $1 AND store_id = $2 FOR UPDATE;
      `;
      const verifyRes = await client.query(verifyQuery, [
        allocationId,
        storeId,
      ]);

      if (verifyRes.rows.length === 0) {
        throw new Error(
          "Target item allocation profile record not found at this node branch.",
        );
      }

      const currentAllocation = verifyRes.rows[0];
      if (currentAllocation.status !== "pending_return") {
        throw new Error(
          "This line item has already been marked and processed through intake check.",
        );
      }

      const nextStatus =
        resolution === "received" ? "item_received" : "item_damaged";

      // A. Update Allocation Record Status
      await client.query(
        `
        UPDATE store_return_allocations 
        SET status = $1, updated_at = now() 
        WHERE id = $2;
      `,
        [nextStatus, allocationId],
      );

      // B. Increment physical store inventory stock if the item is sound
      if (resolution === "received") {
        const updateStockQuery = `
          UPDATE store_products 
          SET stock = stock + $1, updated_at = now()
          WHERE product_id = $2 AND store_id = $3;
        `;
        await client.query(updateStockQuery, [
          currentAllocation.return_quantity,
          currentAllocation.product_id,
          storeId,
        ]);
      }

      // C. Evaluate Parent Multi-Tenant Return State Completeness
      const returnId = currentAllocation.return_id;
      const outstandingQuery = `
        SELECT COUNT(*) as remaining_count 
        FROM store_return_allocations 
        WHERE return_id = $1 AND status = 'pending_return';
      `;
      const outstandingRes = await client.query(outstandingQuery, [returnId]);
      const remainingItems = parseInt(
        outstandingRes.rows[0].remaining_count,
        10,
      );

      // If all distributed allocations are complete, roll the master entry to completed/received
      if (remainingItems === 0) {
        await client.query(
          `
          UPDATE store_order_returns 
          SET status = 'item_received', updated_at = now() 
          WHERE id = $1;
        `,
          [returnId],
        );
      }

      await client.query("COMMIT");

      // D. Trigger Transactional Email notification out to customer if fully complete
      if (remainingItems === 0) {
        await sendReturnStatusUpdateEmail(returnId);
      }

      return NextResponse.json({
        success: true,
        allocationStatus: nextStatus,
        returnClosed: remainingItems === 0,
      });
    } catch (txErr: any) {
      await client.query("ROLLBACK");
      throw txErr;
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error("Fulfillment entry update error loop:", error);
    return NextResponse.json(
      {
        error: error.message || "Internal inventory database execution fault.",
      },
      { status: 500 },
    );
  }
}
