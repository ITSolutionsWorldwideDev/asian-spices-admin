// app/api/store/shipping-methods/route.ts

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/core/db";
import { getCurrentStoreAPI } from "@/lib/auth/guards";

export async function GET(req: NextRequest) {
  try {
    const store = await getCurrentStoreAPI(req);

    if (!store?.id) {
      return NextResponse.json({ error: "Store not found" }, { status: 401 });
    }
    const storeId = store.id;

    /* const { rows } = await pool.query(
      `
      SELECT sm.*, sp.slug
      FROM shipping_methods sm
      LEFT JOIN shipping_providers sp
        ON sm.provider_id = sp.id
      WHERE sm.store_id = $1
        AND sm.is_active = true
      `,
      [storeId],
    ); */
    const { rows } = await pool.query(
      `
      SELECT sm.*, sp.slug
      FROM store_shipping_providers as shp
	    LEFT JOIN shipping_methods sm ON sm.provider_id = sm.provider_id
      LEFT JOIN shipping_providers sp ON sm.provider_id = sp.id
      WHERE shp.store_id = $1
        AND sm.is_active = true
      `,
      [storeId],
    );

    // console.log("STORE:", store);
    // console.log("METHODS COUNT:", rows.length);

    return NextResponse.json({ methods: rows || [] });
  } catch (err: any) {
    console.error("shipping-methods error:", err);

    return NextResponse.json(
      { error: "Failed to load shipping methods" },
      { status: 500 },
    );
  }
}
