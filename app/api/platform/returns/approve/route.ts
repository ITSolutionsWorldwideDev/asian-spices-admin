// app/api/platform/returns/approve/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { webAuthOptions } from "@/core/auth";
import { pool } from "@/core/db";
import { sendReturnStatusUpdateEmail } from "@/core/email-templates";

export async function POST(req: NextRequest) {
  const session = await getServerSession(webAuthOptions);

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized access guard triggered." },
      { status: 401 },
    );
  }

  const body = await req.json();
  const { returnId, status } = body;

  if (!returnId || !["approved", "rejected"].includes(status)) {
    return NextResponse.json(
      { error: "Invalid workflow payloads provided." },
      { status: 400 },
    );
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1. Verify current entry state to avoid double processing mutations
    const checkQuery = `SELECT status, order_id FROM store_order_returns WHERE id = $1 FOR UPDATE;`;
    const checkRes = await client.query(checkQuery, [returnId]);

    if (checkRes.rows.length === 0) {
      throw new Error("Target return tracking profile record missing.");
    }
    if (checkRes.rows[0].status !== "pending") {
      throw new Error(
        "This workflow item has already transitioned out of pending status.",
      );
    }

    const orderId = checkRes.rows[0].order_id;

    // 2. Simply switch status if rejected
    if (status === "rejected") {
      await client.query(
        `UPDATE store_order_returns SET status = 'rejected', updated_at = now() WHERE id = $1;`,
        [returnId],
      );
      await client.query("COMMIT");
      return NextResponse.json({ success: true, status: "rejected" });
    }

    // 3. Status is 'approved' -> Compute reverse allocation routes
    const returnItemsQuery = `SELECT product_id, quantity FROM store_order_return_items WHERE return_id = $1;`;
    const returnItemsRes = await client.query(returnItemsQuery, [returnId]); 

    for (const returnItem of returnItemsRes.rows) {

      const { product_id, quantity: totalQtyToReturn } = returnItem;

      // Pull forward allocations that fulfilled this specific item, ordered by biggest fulfilled count
      const forwardAllocQuery = `
        SELECT id, store_id, fulfilled_quantity 
        FROM order_item_allocations 
        WHERE order_id = $1 AND order_item_id IN (
           SELECT id FROM store_order_items WHERE order_id = $1 AND product_id = $2
        ) AND status = 'fulfilled'
        ORDER BY fulfilled_quantity DESC;
      `;
      const forwardAllocRes = await client.query(forwardAllocQuery, [
        orderId,
        product_id,
      ]);

      let remainingQtyToRoute = totalQtyToReturn;

      for (const allocation of forwardAllocRes.rows) {
        if (remainingQtyToRoute <= 0) break;


        // Ensure we do not pass the original store shipment ceiling
        const claimableQty = Math.min(
          remainingQtyToRoute,
          allocation.fulfilled_quantity,
        );

        await client.query(
          `
          INSERT INTO store_return_allocations (
            return_id, order_item_allocation_id, store_id, product_id, return_quantity, status
          ) VALUES ($1, $2, $3, $4, $5, 'pending_return');
        `,
          [
            returnId,
            allocation.id,
            allocation.store_id,
            product_id,
            claimableQty,
          ],
        );

        remainingQtyToRoute -= claimableQty;
      }

      if (remainingQtyToRoute > 0) {
        throw new Error(
          `Mismatched allocations. Unable to track origin stores for ${remainingQtyToRoute} units of item ${product_id}.`,
        );
      }
    }

    // 4. Update parent entry status to approved
    await client.query(
      `UPDATE store_order_returns SET status = 'approved', updated_at = now() WHERE id = $1;`,
      [returnId],
    );

    await client.query("COMMIT");

    await sendReturnStatusUpdateEmail(returnId);

    return NextResponse.json({ success: true, status: "approved" });
  } catch (error: any) {
    await client.query("ROLLBACK");
    console.error("Critical return workflow routing transaction breakdown:", error);

    const errorMessage = error.message || "";
    
    // Check if the thrown error is our intentional allocation mismatch
    if (errorMessage.includes("Mismatched allocations")) {
      return NextResponse.json(
        { 
          error: "Allocation Breakdown Mismatch",
          message: errorMessage,
          code: "ALLOCATION_MISMATCH"
        },
        { status: 422 } // Unprocessable Entity is much more descriptive than 500
      );
    }
    return NextResponse.json(
      { error: error.message || "Internal transaction logic loop collapse." },
      { status: 500 },
    );
  } finally {
    client.release();
  }
}
