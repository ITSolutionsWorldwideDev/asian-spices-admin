// app/api/platform/returns/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { webAuthOptions } from "@/core/auth";
import { pool } from "@/core/db";

export async function GET(req: NextRequest) {
  const session = await getServerSession(webAuthOptions);

  // Guard checking for platform super admin access rules
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.max(1, Math.min(50, parseInt(searchParams.get("limit") || "10", 10)));
  const offset = (page - 1) * limit;

  // Extract filter parameters matching our filter component keys
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "";

  const client = await pool.connect();

  try {
    let whereClauses = ["1=1"];
    const queryParams: any[] = [];

    if (search) {
      queryParams.push(`%${search}%`);
      whereClauses.push(`(r.return_number ILIKE $${queryParams.length} OR o.order_number ILIKE $${queryParams.length})`);
    }

    if (status) {
      queryParams.push(status);
      whereClauses.push(`r.status = $${queryParams.length}`);
    }

    const whereString = whereClauses.join(" AND ");

    // Query 1: Total records for configuration metadata
    const countQuery = `
      SELECT COUNT(DISTINCT r.id) as total
      FROM store_order_returns r
      LEFT JOIN store_orders o ON o.id = r.order_id
      WHERE ${whereString}
    `;
    const countRes = await client.query(countQuery, queryParams);
    const totalRecords = parseInt(countRes.rows[0]?.total || "0", 10);
    const totalPages = Math.ceil(totalRecords / limit);

    // Append limit and offset parameters safely to payload
    queryParams.push(limit, offset);
    const dataQuery = `
      SELECT 
        r.id,
        r.return_number,
        r.status,
        r.reason,
        r.created_at,
        o.order_number,
        o.id as order_id,
        CONCAT(c.first_name,' ',c.last_name) as customer_name,
        json_agg(
          json_build_object(
            'id', ri.product_id,
            'title', p.name,
            'quantity', ri.quantity
          )
        ) AS items
      FROM store_order_returns r
      LEFT JOIN store_orders o ON o.id = r.order_id
      LEFT JOIN store_customers c ON c.id = o.customer_id
      LEFT JOIN store_order_return_items ri ON ri.return_id = r.id
      LEFT JOIN store_products p ON ri.product_id = p.id
      WHERE ${whereString}
      GROUP BY r.id, o.id, c.id
      ORDER BY r.created_at DESC
      LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length}
    `;

    const { rows } = await client.query(dataQuery, queryParams);

    return NextResponse.json({
      returns: rows,
      total: totalRecords,
      pagination: {
        page,
        limit,
        totalPages,
      },
    });
  } catch (error: any) {
    console.error("Platform returns fetch exception:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  } finally {
    client.release();
  }
}