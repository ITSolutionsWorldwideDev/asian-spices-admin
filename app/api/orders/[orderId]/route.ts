// /app/api/orders/[orderId]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/core/db";
import { getCurrentStoreAPI } from "@/lib/auth/guards";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> },
) {
  try {
    const store = await getCurrentStoreAPI(req);
    const storeId = store.id;

    if (!storeId) {
      return NextResponse.json(
        { error: "Store not resolved" },
        { status: 400 },
      );
    }

    const { orderId } = await params;

    // 🔹 Fetch Order
    const orderResult = await pool.query(
      `
      SELECT DISTINCT
        o.id, -- Frontend expects 'id' directly for field locking evaluations
        o.id AS order_id,
        o.order_number,
        o.created_at AS order_date,
        o.payment_status AS status,
        o.total_amount,
        o.subtotal,
        o.tax_amount,
        o.discount_amount,
        o.shipping_amount,
        c.company_name AS customer_name,
        c.email AS customer_email,
        c.city AS customer_city,
        c.postcode AS customer_postcode,
        o.weight,
        o.length,
        o.width,
        o.height,
        o.boxes,
        o.fulfillment_status,
        o.order_status,
        o.payment_status,
        o.payment_method,
        o.transaction_id,
        o.tracking_number,
        o.shipping_label,
        o.shipping_provider,
        o.shipped_at,
        o.shipping_status,
        o.shipping_paid,
        o.payment_url,
        s.id AS shipment_id,
        s.external_shipment_id,
        s.label_url,
        s.tracking_url
      FROM store_orders o
      LEFT JOIN store_customers c ON c.id = o.customer_id
      LEFT JOIN shipments s ON s.order_id = o.id
      INNER JOIN order_item_allocations oia ON oia.order_id = o.id
      WHERE o.id = $1 AND oia.store_id = $2
      `,
      [orderId, storeId],
    );

    if (!orderResult.rows.length) {
      return NextResponse.json(
        { error: "Order allocation context not found for this store" },
        { status: 404 },
      );
    }

    // 🔹 Fetch Items
    const itemsResult = await pool.query(
      `
      SELECT
        oi.id AS order_item_id,
        oia.id AS allocation_id,
        oia.allocated_quantity AS quantity, -- The partner store only fulfills what was allocated to them
        COALESCE(oia.fulfilled_quantity, 0) AS fulfilled_quantity,
        sp.id AS product_id,
        sp.name,
        sp.sku,  
        sp.quantity AS available_stock,
        oi.price
      FROM store_order_items oi
      INNER JOIN order_item_allocations oia ON oia.order_item_id = oi.id
      LEFT JOIN store_products sp ON sp.id = oi.product_id
      WHERE oi.order_id = $1 AND oia.store_id = $2
      `,
      [orderId, storeId],
    );

    return NextResponse.json({
      order: {
        ...orderResult.rows[0],
        items: itemsResult.rows,
      },
    });
  } catch (error) {
    console.error("Order detail fetch failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch order detail" },
      { status: 500 },
    );
  }
}

/* const orderResult = await pool.query(
      `
      SELECT
        o.id,
        o.id AS order_id,
        o.order_number,
        o.created_at AS order_date,
        o.payment_status AS status,
        o.total_amount,
        o.subtotal,
        o.tax_amount,
        o.discount_amount,
        o.shipping_amount,
        c.company_name AS customer_name,
        c.email AS customer_email,
        c.city AS customer_city,
        c.postcode AS customer_postcode,
        o.weight,
        o.length,
        o.width,
        o.height,
        o.boxes,
        o.fulfillment_status,
        o.order_status,
        o.payment_status,
        o.payment_method,
        o.transaction_id,
        o.tracking_number,
        o.shipping_label,
        o.shipping_provider,
        o.shipped_at,
        
        o.shipping_status,
        o.shipping_paid,
        o.payment_url,
        s.id AS shipment_id,
        s.external_shipment_id,
        s.label_url,
        s.tracking_url

      FROM store_orders o
      LEFT JOIN store_customers c ON c.id = o.customer_id
      LEFT JOIN shipments s ON s.order_id = o.id
      WHERE o.id = $1 AND o.store_id = $2
      `,
      [orderId, storeId],
    ); */

// const itemsResult = await pool.query(
//   `
//   SELECT
//     oi.id AS order_item_id,
//     oi.quantity,
//     sp.id AS product_id,
//     sp.name,
//     sp.sku,
//     oi.fulfilled_quantity,
//     sp.quantity as available_stock,
//     oi.price
//   FROM store_order_items oi
//   LEFT JOIN store_products sp ON sp.id = oi.product_id
//   WHERE oi.order_id = $1
//   `,
//   [orderId],
// );

/* import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/core/db";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params;

  try {
    const orderResult = await pool.query(
      `
      SELECT
        o.order_id,
        o.order_date,
        o.status,
        o.total_amount,
        o.shipping_address,
        o.payment_method,
        o.payment_reference,
        u.name AS customer_name,
        u.email AS customer_email
      FROM orders o
      LEFT JOIN users u ON u.id = o.user_id
      WHERE o.order_id = $1
      `,
      [orderId]
    );

    if (!orderResult.rows.length) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const itemsResult = await pool.query(
      `
      SELECT
        oi.order_item_id,
        oi.quantity,
        oi.price,
        p.product_id,
        p.name,
        p.sku,
        pi.media_id AS image
      FROM order_items oi
      LEFT JOIN products p ON p.product_id = oi.product_id
      LEFT JOIN product_images pi 
        ON pi.product_id = p.product_id AND pi.is_primary = true
      WHERE oi.order_id = $1
      `,
      [orderId]
    );

    return NextResponse.json({
      order: {
        ...orderResult.rows[0],
        items: itemsResult.rows,
      },
    });
  } catch (error) {
    console.error("Order detail fetch failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch order detail" },
      { status: 500 }
    );
  }
} */
