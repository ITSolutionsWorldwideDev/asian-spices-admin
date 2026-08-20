// /app/api/orders-queue/[orderId]/route.ts (GET)

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/core/db";
import { getCurrentStoreAPI } from "@/lib/auth/guards";

interface AllocatedItemRow {
  allocation_id: string;
  order_item_id: string;
  quantity: string | number;
  product_id: string;
  name: string;
  sku: string;
  allocation_status: string;
  available_stock: number;
  price: string | number;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> },
) {
  try {
    const store = await getCurrentStoreAPI(req);
    const storeId = store?.id;

    if (!storeId) {
      return NextResponse.json(
        { error: "Unauthorized: Store context not resolved" },
        { status: 401 },
      );
    }

    const { orderId } = await params;

    // 1️⃣ Fetch Order Base Data constrained by actual allocation ownership
    // Instead of checking top-level table properties, we ensure an active allocation mapping entry exists.
    const orderResult = await pool.query(
      `
      SELECT DISTINCT
        o.id AS order_id,
        o.order_number,
        o.created_at AS order_date,
        o.payment_status AS status,
        o.payment_status,
        o.discount_amount,
        o.subtotal,
        o.tax_amount,
        o.shipping_amount,
        o.total_amount,
        o.order_status,
        o.shipping_city as customer_city,
        o.shipping_state as customer_state,
        o.shipping_country as customer_country,        
        o.shipping_postal_code as customer_postcode,
        o.weight,
        o.length,
        o.width,
        o.height,
        o.boxes,
        o.tracking_number,
        o.shipping_label,
        o.shipping_provider,
        o.shipped_at,
        COALESCE(o.order_type, 'B2C') as order_type
      FROM store_orders o
      JOIN order_item_allocations oia ON oia.order_id = o.id
      WHERE o.id = $1 AND oia.store_id = $2
      `,
      [orderId, storeId],
    );

    if (!orderResult.rowCount) {
      return NextResponse.json(
        {
          error:
            "Order context not found or access denied for this store location",
        },
        { status: 404 },
      );
    }

    const orderData = orderResult.rows[0];

    // 2️⃣ Fetch isolated item subsets allocated to this specific partner store location
    const itemsResult = await pool.query<AllocatedItemRow>(
      `
      SELECT
        oia.id AS allocation_id,
        oi.id AS order_item_id,
        oia.allocated_quantity AS quantity, -- The split quantity this store is responsible for
        sp.id AS product_id,
        sp.name,
        sp.sku,  
        oia.status AS allocation_status,
        COALESCE(sp.quantity, 0) as available_stock,
        oi.price
      FROM order_item_allocations oia
      JOIN store_order_items oi ON oi.id = oia.order_item_id
      LEFT JOIN store_products sp ON sp.id = oi.product_id
      WHERE oia.order_id = $1 AND oia.store_id = $2
      `,
      [orderId, storeId],
    );

    // 3️⃣ Dynamically compute financial aggregates for this local partition string context
    const formattedItems = itemsResult.rows.map(
      (item: {
        price: string | number;
        quantity: string | number;
        allocation_status: string;
        [key: string]: any;
      }) => {
        const itemPrice = Number(item.price);
        const allocatedQty = Number(item.quantity);

        return {
          ...item,
          price: itemPrice,
          quantity: allocatedQty,
          fulfilled_quantity:
            item.allocation_status === "accepted" ? allocatedQty : 0,
        };
      },
    );

    // Use order totals directly from store_orders
    const orderDetails = {
      ...orderData,
      subtotal: Number(orderData.subtotal || 0),
      tax_amount: Number(orderData.tax_amount || 0),
      shipping_amount: Number(orderData.shipping_amount || 0),
      total_amount: Number(orderData.total_amount || 0),
      items: formattedItems,
    };

    return NextResponse.json({ order: orderDetails });
  } catch (error) {
    console.error("Order detail split fetch breakdown failed:", error);
    return NextResponse.json(
      { error: "Failed to gather localized order granular structures" },
      { status: 500 },
    );
  }
}
