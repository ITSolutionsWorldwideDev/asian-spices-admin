// app/api/shipping/methods/route.ts

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/core/db";
import { getCurrentStoreAPI } from "@/lib/auth/guards";

export async function POST(req: NextRequest) {
  try {
    const store = await getCurrentStoreAPI(req);
    const body = await req.json();

    const { name, provider_id, type } = body;

    if (!name || !provider_id || !type) {
      return NextResponse.json(
        { success: false, error: "Missing fields" },
        { status: 400 }
      );
    }

    // -----------------------------
    // VERIFY provider belongs to store
    // -----------------------------
    const providerCheck = await pool.query(
      `
      SELECT p.id
      FROM shipping_providers p
      JOIN store_shipping_providers sp
        ON sp.provider_id = p.id
      WHERE p.id = $1
        AND sp.store_id = $2
        AND sp.is_enabled = true
      `,
      [provider_id, store.id]
    );

    if (!providerCheck.rows.length) {
      return NextResponse.json(
        {
          success: false,
          error: "Provider not enabled for this store",
        },
        { status: 403 }
      );
    }

    // -----------------------------
    // Insert shipping method
    // -----------------------------
    const result = await pool.query(
      `
      INSERT INTO shipping_methods 
        (store_id, name, provider_id, type)
      VALUES ($1, $2, $3, $4)
      RETURNING *
      `,
      [store.id, name, provider_id, type]
    );

    return NextResponse.json({
      success: true,
      method: result.rows[0],
    });
  } catch (err) {
    console.error("shipping methods error:", err);

    return NextResponse.json(
      { success: false, error: "Failed to create shipping method" },
      { status: 500 }
    );
  }
}


/* import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/core/db";
import { getCurrentStoreAPI } from "@/lib/auth/guards";

export async function POST(req: NextRequest) {
  try {
    const store = await getCurrentStoreAPI(req);
    const body = await req.json();

    const { name, provider_id, type } = body;

    const result = await pool.query(
      `
      INSERT INTO shipping_methods (store_id, name, provider_id, type)
      VALUES ($1, $2, $3, $4)
      RETURNING *
      `,
      [store.id, name, provider_id, type]
    );

    return NextResponse.json({ success: true, method: result.rows[0] });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
} */