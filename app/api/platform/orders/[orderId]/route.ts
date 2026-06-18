// app/api/platform/orders/[orderId]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/core/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> },
) {
  try {
    const { orderId } = await params;

    const { rows } = await pool.query(
      `
        SELECT 
        o.*,
        o.created_at as assigned_at,
        (o.created_at + interval '1 hour') as deadline,
        s.name as store_name,
        c.first_name || ' ' || c.last_name as customer_name,
        c.email,
        c.phone,
        o.shipping_address_line1,
        o.shipping_city,
        o.shipping_country
        FROM store_orders o
        LEFT JOIN stores s ON (s.id = o.current_store_id OR s.id = o.store_id)
        LEFT JOIN store_customers c ON c.id = o.customer_id
        WHERE o.id = $1
    `,
      [orderId],
    );

    const order = rows[0];

    // order not found
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const { rows: items } = await pool.query(
      `
        SELECT 
            oi.id,
            oi.quantity,
            COALESCE(oi.fulfilled_quantity, 0) as fulfilled_quantity,
            oi.status,
            p.name as product_name,
            
            COALESCE(
            (
              SELECT json_agg(
                json_build_object(
                  'store_id', oia.store_id,
                  'store_name', s2.name,
                  'allocated_quantity', oia.allocated_quantity,
                  'fulfilled_quantity', oia.fulfilled_quantity,
                  'status', oia.status
                )
              )
              FROM order_item_allocations oia
              JOIN stores s2 ON s2.id = oia.store_id
              WHERE oia.order_item_id = oi.id
            ),
            '[]'::json
          ) as allocations

        FROM store_order_items oi
        JOIN store_products p ON p.id = oi.product_id

        WHERE oi.order_id = $1
        ORDER BY oi.id ASC
        `,
      [orderId],
    );

    // 🔥 PARSE allocations safely
    const parsedItems = items.map((item: any) => ({
      ...item,
      fulfilled_quantity: Number(item.fulfilled_quantity || 0),
      allocations:
        typeof item.allocations === "string"
          ? JSON.parse(item.allocations)
          : item.allocations || [],
    }));

    order.items = parsedItems;

    return NextResponse.json({ order });
  } catch (error: any) {
    console.error("ORDER DETAILS API ERROR:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch order details",
        message: error.message,
      },
      { status: 500 },
    );
  }
}
/* 



            COALESCE(
                json_agg(
                    json_build_object(
                    'store_id', oia.store_id,
                    'store_name', s2.name,
                    'allocated_quantity', oia.allocated_quantity,
                    'fulfilled_quantity', oia.fulfilled_quantity,
                    'status', oia.status
                    )
                ) FILTER (WHERE oia.id IS NOT NULL),
                '[]'
            ) as allocations


            
        LEFT JOIN order_item_allocations oia 
            ON oia.order_item_id = oi.id
        LEFT JOIN stores s2 ON s2.id = oia.store_id
        
        GROUP BY oi.id, p.name

*/

    /* const { rows } = await pool.query(
      `
        SELECT 
        o.*,
        o.created_at as assigned_at,
        (o.created_at + interval '1 hour') as deadline,
        s.name as store_name,
        c.first_name || ' ' || c.last_name as customer_name,
        c.email,
        c.phone,
        a.address_line1,
        a.city,
        a.country
        FROM store_orders o
        LEFT JOIN stores s ON (s.id = o.current_store_id OR s.id = o.store_id)
        LEFT JOIN store_customers c ON c.id = o.customer_id
        LEFT JOIN store_customer_addresses a 
        ON a.customer_id = c.id
        WHERE o.id = $1
    `,
      [orderId],
    ); */