// app/api/store-currency/route.ts (GET)

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/core/db";
import { getCurrentStoreAPI } from "@/lib/auth/guards";

/* ----------------------------------
   GET store currency
---------------------------------- */
export async function GET(req: NextRequest) {
  const client = await pool.connect();

  try {
    const store = await getCurrentStoreAPI(req);
    const storeId = store.id;


    if (!storeId) {
      return NextResponse.json(
        { error: "Store not resolved" },
        { status: 400 },
      );
    }

    const { rows } = await client.query(
      `
      SELECT 
        scs.base_currency_id,
        c.code,
        c.symbol,
        c.name
      FROM store_currency_settings scs
      JOIN currencies c ON c.id = scs.base_currency_id
      WHERE scs.store_id = $1
      `,
      [storeId]
    );

    return NextResponse.json({
      currency: rows[0] || null,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

/* ----------------------------------
   SET store currency
---------------------------------- */
export async function POST(req: NextRequest) {
  const client = await pool.connect();

  try {
    const store = await getCurrentStoreAPI(req);
    const storeId = store.id;

    if (!storeId) {
      return NextResponse.json(
        { error: "Store not resolved" },
        { status: 400 },
      );
    }

    const body = await req.json();

    const { base_currency_id } = body;

    if (!base_currency_id) {
      return NextResponse.json(
        { error: "base_currency_id required" },
        { status: 400 }
      );
    }

    await client.query("BEGIN");

    await client.query(
      `
      INSERT INTO store_currency_settings (store_id, base_currency_id)
      VALUES ($1, $2)
      ON CONFLICT (store_id)
      DO UPDATE SET 
        base_currency_id = EXCLUDED.base_currency_id,
        updated_at = now()
      `,
      [storeId, base_currency_id]
    );

    await client.query("COMMIT");

    return NextResponse.json({ success: true });
  } catch (err: any) {
    await client.query("ROLLBACK");

    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}