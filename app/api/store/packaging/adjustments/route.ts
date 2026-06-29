// app/api/store/packaging/adjustments/route.ts

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/core/db";
import { getCurrentStoreAPI } from "@/lib/auth/guards";

export async function POST(req: NextRequest) {
  const client = await pool.connect();
  try {
    const body = await req.json();

    const store = await getCurrentStoreAPI(req);

    if (!store?.id) {
      return NextResponse.json({ error: "Store not found" }, { status: 401 });
    }
    const storeId = store.id;

    const { packaging_type_id, type, quantity, reason } = body;

    if (!packaging_type_id || !type || !quantity) {
      return NextResponse.json(
        { success: false, error: "Required fields missing." },
        { status: 400 },
      );
    }

    const changeAmount = parseInt(quantity, 10);
    if (isNaN(changeAmount) || changeAmount === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Quantity delta parameter must be a non-zero integer",
        },
        { status: 400 },
      );
    }

    await client.query("BEGIN");

    // Fetch the current state using a row-level lock to prevent concurrency race conditions
    const currentInventory = await client.query(
      `SELECT quantity_available FROM store_packaging_inventory 
       WHERE store_id = $1 AND packaging_type_id = $2 FOR UPDATE`,
      [storeId, packaging_type_id],
    );

    if (currentInventory.rows.length === 0) {
      await client.query("ROLLBACK");
      return NextResponse.json(
        {
          success: false,
          error:
            "Target packaging catalog assignment not found for this store.",
        },
        { status: 404 },
      );
    }

    const available = currentInventory.rows[0].quantity_available;

    // Apply conditional changes depending on adjustment target field criteria
    if (type === "damaged") {
      // CRITICAL GUARD: Stop stocks from dropping below 0
      if (available < changeAmount) {
        await client.query("ROLLBACK");
        return NextResponse.json(
          {
            success: false,
            error: `Insufficient inventory available to log damage. Available: ${available}, Requested: ${changeAmount}`,
          },
          { status: 400 },
        );
      }

      // Moves inventory from clean available pile to damaged bucket field tracking
      await client.query(
        `
        UPDATE store_packaging_inventory
        SET 
          quantity_available = quantity_available - $3,
          damaged_quantity = damaged_quantity + $3,
          updated_at = NOW()
        WHERE store_id = $1 AND packaging_type_id = $2
        `,
        [storeId, packaging_type_id, changeAmount],
      );
    } else {
      // Direct adjustment balancing validation check guard layer
      if (available + changeAmount < 0) {
        await client.query("ROLLBACK");
        return NextResponse.json(
          {
            success: false,
            error:
              "Calibration correction balance values would fall into negative ranges.",
          },
          { status: 400 },
        );
      }

      // Direct adjustment balancing of absolute stock assets
      await client.query(
        `
        UPDATE store_packaging_inventory
        SET 
          quantity_available = quantity_available + $3,
          updated_at = NOW()
        WHERE store_id = $1 AND packaging_type_id = $2
        `,
        [storeId, packaging_type_id, changeAmount],
      );
    }

    // Write persistent immutable audit history record entry tracking line
    await client.query(
      `
      INSERT INTO packaging_inventory_logs (store_id, packaging_type_id, type, quantity_changed, reason)
      VALUES ($1, $2, $3, $4, $5)
      `,
      [
        storeId,
        packaging_type_id,
        type,
        changeAmount,
        reason || "Manual operational balancing adjust log entries",
      ],
    );

    await client.query("COMMIT");
    return NextResponse.json({ success: true });
  } catch (err: any) {
    await client.query("ROLLBACK");
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 },
    );
  } finally {
    client.release();
  }
}
