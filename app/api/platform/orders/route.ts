// app/api/platform/orders/route.ts

import { NextResponse, NextRequest } from "next/server";
import { pool } from "@/core/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const limit = Math.max(1, Math.min(100, Number(searchParams.get("limit") || 10)));
    const offset = (page - 1) * limit;

    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const product = searchParams.get("product") || "";
    const sort = searchParams.get("sort") || "";

    // 💡 CRITICAL CHANGE: values ONLY contains where-clause filters now.
    // This keeps parameter indexing identical for both Data and Count queries.
    const values: any[] = [];
    let whereConditions = ["1=1"];

    // 🔍 Search Filter Mapping
    if (search.trim()) {
      values.push(`%${search.trim()}%`);
      whereConditions.push(`o.order_number ILIKE $${values.length}`);
    }

    // 📌 Status Filter Mapping
    if (status.trim()) {
      values.push(status.trim().toLowerCase());
      whereConditions.push(`o.order_status = $${values.length}`);
    }

    // 📦 Product Title Filtering via Subquery Exists Check
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

    // 🔥 SORTING ENGINE LOGIC
    let orderBy = `ORDER BY o.created_at DESC`; 

    if (sort === "date_asc") {
      orderBy = `ORDER BY o.created_at ASC`;
    } else if (sort === "total_desc") {
      orderBy = `ORDER BY o.total_amount DESC NULLS LAST`; 
    } else if (sort === "total_asc") {
      orderBy = `ORDER BY o.total_amount ASC NULLS LAST`;
    } else if (sort === "priority" || !sort) {
      orderBy = `
        ORDER BY 
          CASE WHEN o.order_status = 'rejected' THEN 0 
               WHEN o.order_status = 'processing' AND o.rejection_count > 2 THEN 1
               ELSE 2 END ASC,
          o.rejection_count DESC,
          o.created_at DESC
      `;
    }

    // Append limit and offset securely to the data query using safe string numbers
    const dataQuery = `
      SELECT 
        o.id,
        o.order_number,
        o.order_status,
        o.fulfillment_status,
        o.rejection_count,
        o.created_at,
        s.name as store_name
      FROM store_orders o
      LEFT JOIN stores s ON s.id = o.current_store_id
      ${whereClause}
      ${orderBy}
      LIMIT ${limit} OFFSET ${offset}
    `;

    const countQuery = `
      SELECT COUNT(*) FROM store_orders o ${whereClause}
    `;

    // Both queries pass the identical filter values array now!
    const [dataRes, countRes] = await Promise.all([
      pool.query(dataQuery, values),
      pool.query(countQuery, values),
    ]);

    return NextResponse.json({
      orders: dataRes.rows,
      total: Number(countRes.rows[0].count),
      page,
      limit,
    });
  } catch (error: any) {
    console.error("ADMIN ORDERS FILTERED FEED ERROR:", error);
    return NextResponse.json(
      { error: "Failed to query system orders with filters applied", detail: error.message }, 
      { status: 500 }
    );
  }
}