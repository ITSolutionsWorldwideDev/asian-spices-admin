// apps/admin/app/api/store/orders/route.ts

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/core/db";
import { getCurrentStoreAPI } from "@/lib/auth/guards";

export async function GET(req: NextRequest) {
  const store = await getCurrentStoreAPI(req);
  const storeId = store.id;

  const { rows } = await pool.query(
    `
        SELECT 
            o.id as order_id,
            o.order_number,
            o.payment_status,
            o.created_at,

            json_agg(
                json_build_object(
                'allocation_id', oia.id,
                'product_id', oi.product_id,
                'quantity', oia.allocated_quantity,
                'status', oia.status
                )
            ) as items

        FROM order_item_allocations oia
        JOIN store_order_items oi ON oi.id = oia.order_item_id
        JOIN store_orders o ON o.id = oi.order_id

        WHERE oia.store_id = $1
        AND o.routing_status IN ('assigned','split','accepted')

        GROUP BY o.id
        ORDER BY o.created_at DESC
    `,
    [storeId],
  );

return NextResponse.json({ orders: rows });
}
