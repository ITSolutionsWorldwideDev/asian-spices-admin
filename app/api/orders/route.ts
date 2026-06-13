// /app/api/orders/route.ts (GET)

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/core/db";
import { getCurrentStoreAPI } from "@/lib/auth/guards";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;

    const store = await getCurrentStoreAPI(req);
    const storeId = store.id;

    if (!storeId) {
      return NextResponse.json(
        { error: "Store not resolved" },
        { status: 400 },
      );
    }

    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const product = searchParams.get("product") || "";
    const sort = searchParams.get("sort") || "";

    const orderStatus = searchParams.get("order_status");

    const values: any[] = [storeId];

    let whereConditions = [
      "(o.store_id = $1 OR o.current_store_id = $1)",
      " o.payment_status = 'paid' ",
      "o.order_status != 'processing'",
    ];

    // 🔍 Reference ID Filter
    if (search.trim()) {
      values.push(`%${search.trim()}%`);
      whereConditions.push(`o.order_number ILIKE $${values.length}`);
    }

    // 📌 Internal Status Toggle (Allows sorting through accepted vs shipped locally)
    if (status.trim()) {
      values.push(status.trim().toLowerCase());
      whereConditions.push(`o.order_status = $${values.length}`);
    }

    // 📦 Product Filtering
    if (product.trim()) {
      values.push(`%${product.trim()}%`);
      whereConditions.push(`
        EXISTS (
          SELECT 1 FROM store_order_items oi
          JOIN store_products p ON p.id = oi.product_id
          WHERE oi.order_id = o.id AND p.name ILIKE $${values.length}
        )
      `);
    }

    const whereClause = `WHERE ${whereConditions.join(" AND ")}`;

    let orderBy = `ORDER BY o.updated_at DESC`;
    if (sort === "date_asc") orderBy = `ORDER BY o.created_at ASC`;
    if (sort === "total_desc") orderBy = `ORDER BY o.total_amount DESC`;
    if (sort === "total_asc") orderBy = `ORDER BY o.total_amount ASC`;

    const query = `
      SELECT
        o.id AS order_id,
        o.order_number,
        o.fulfillment_status,
        o.payment_status,
        o.tracking_number,
        o.shipping_label,
        o.shipping_provider,
        o.payment_method,
        o.transaction_id,
        o.created_at AS order_date,
        o.payment_status,
        o.order_status,
        o.total_amount,
        c.company_name AS customer_name,
        (SELECT COALESCE(SUM(quantity), 0) FROM store_order_items WHERE order_id = o.id) as items_count
      FROM store_orders o
      LEFT JOIN store_customers c ON c.id = o.customer_id

      ${whereClause}
      ${orderBy}
    `;

    const { rows } = await pool.query(query, values);
    return NextResponse.json({ items: rows });
  } catch (error) {
    console.error("Orders listing fetch failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders listing" },
      { status: 500 },
    );
  }
}



    // const search = searchParams.get("search");
    // const customer = searchParams.get("customer");
    // const product = searchParams.get("product");
    // const status = searchParams.get("status");
    // const sort = searchParams.get("sort");
    /* let where = `
      WHERE o.store_id = $1
    `;

    if (orderStatus) {
      values.push(orderStatus);
      where += ` AND o.order_status = $${values.length}`;
    } else {
      where += ` AND o.order_status IN (
      'accepted',
      'processing',
      'completed',
      'confirmed',
      'fulfilled',
      'partially_confirmed'
      )`;
    } 

    // 🔎 Global search
    if (search) {
      values.push(`%${search}%`);
      where += ` AND (
        o.order_number ILIKE $${values.length}
        OR c.company_name ILIKE $${values.length}
      )`;
    }

    if (product) {
      values.push(`%${product}%`);
      where += ` AND sp.name ILIKE $${values.length}`;
    }

    if (status) {
      values.push(status);
      where += ` AND o.payment_status = $${values.length}`;
    }
      

    let orderBy = "ORDER BY o.created_at DESC";
    if (sort === "date_asc") orderBy = "ORDER BY o.created_at ASC";
    if (sort === "total_desc") orderBy = "ORDER BY o.total_amount DESC";
    if (sort === "total_asc") orderBy = "ORDER BY o.total_amount ASC";
    */