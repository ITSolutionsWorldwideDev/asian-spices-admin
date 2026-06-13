// apps/admin/app/api/platform/orders/analytics/route.ts

import { NextResponse } from "next/server";
import { pool } from "@/core/db";

export async function GET() {
  const { rows } = await pool.query(`
    SELECT 
      s.name as store_name,

      COUNT(DISTINCT oia.order_item_id) as total_items,
      SUM(oia.fulfilled_quantity) as total_fulfilled,

      COUNT(*) FILTER (WHERE oia.status = 'fulfilled') as full_count,
      COUNT(*) FILTER (WHERE oia.status = 'partial') as partial_count,
      COUNT(*) FILTER (WHERE oia.status = 'rejected') as rejected_count

    FROM order_item_allocations oia
    JOIN stores s ON s.id = oia.store_id

    GROUP BY s.name
    ORDER BY total_fulfilled DESC
  `);

  return NextResponse.json({ analytics: rows });
}
