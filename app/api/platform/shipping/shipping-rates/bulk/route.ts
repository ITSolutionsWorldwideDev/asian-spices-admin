// app/api/platform/shipping/shipping-rates/bulk/route.ts

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/core/db";
import { requirePlatformAdmin } from "@/lib/auth/guards";

export async function POST(req: NextRequest) {
  const client = await pool.connect();

  try {
    await requirePlatformAdmin();

    const body = await req.json();
    const { methodId, rates } = body;

    if (!methodId || !Array.isArray(rates)) {
      return NextResponse.json(
        { success: false, error: "Missing methodId or rates" },
        { status: 400 },
      );
    }

    await client.query("BEGIN");

    // ---------------------------------------
    // 🔍 Get existing rates
    // ---------------------------------------
    const existingRes = await client.query(
      `SELECT id FROM shipping_rates WHERE method_id = $1`,
      [methodId],
    );

    // const existingIds = existingRes.rows.map((r) => r.id);
    const existingIds = existingRes.rows.map(
      (r: { id: string | number; [key: string]: any }) => r.id,
    );

    // IDs coming from frontend
    const incomingIds = rates.filter((r: any) => r.id).map((r: any) => r.id);

    // ---------------------------------------
    // ❌ Delete removed rates
    // ---------------------------------------
    // const toDelete = existingIds.filter((id) => !incomingIds.includes(id));

    const toDelete = existingIds.filter(
      (id: string | number) => !incomingIds.includes(id),
    );

    if (toDelete.length > 0) {
      await client.query(
        `DELETE FROM shipping_rates WHERE id = ANY($1::uuid[])`,
        [toDelete],
      );
    }

    // ---------------------------------------
    // 🔁 Upsert (insert/update)
    // ---------------------------------------
    for (const rate of rates) {
      const {
        id,
        country,
        state,
        city,
        min_weight,
        max_weight,
        min_price,
        max_price,
        price,
      } = rate;

      // Basic validation
      if (price === undefined || price === null) {
        throw new Error("Rate price is required");
      }

      if (id) {
        // UPDATE
        await client.query(
          `
          UPDATE shipping_rates
          SET 
            country = $1,
            state = $2,
            city = $3,
            min_weight = $4,
            max_weight = $5,
            min_price = $6,
            max_price = $7,
            price = $8,
            updated_at = NOW()
          WHERE id = $9
          `,
          [
            country || null,
            state || null,
            city || null,
            min_weight || null,
            max_weight || null,
            min_price || null,
            max_price || null,
            price,
            id,
          ],
        );
      } else {
        // INSERT
        await client.query(
          `
          INSERT INTO shipping_rates (
            method_id,
            country,
            state,
            city,
            min_weight,
            max_weight,
            min_price,
            max_price,
            price
          )
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
          `,
          [
            methodId,
            country || null,
            state || null,
            city || null,
            min_weight || null,
            max_weight || null,
            min_price || null,
            max_price || null,
            price,
          ],
        );
      }
    }

    await client.query("COMMIT");

    return NextResponse.json({
      success: true,
      message: "Rates updated successfully",
    });
  } catch (err: any) {
    await client.query("ROLLBACK");

    console.error("bulk rates error:", err);

    return NextResponse.json(
      {
        success: false,
        error: err.message || "Server error",
      },
      { status: 500 },
    );
  } finally {
    client.release();
  }
}
