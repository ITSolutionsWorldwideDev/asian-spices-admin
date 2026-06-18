// app/api/customers/[customerId]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/core/db";
import { getCurrentStoreAPI } from "@/lib/auth/guards";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ customerId: string }> }
) {
  try {
    const store = await getCurrentStoreAPI(req);
    const { customerId } = await params;

    const result = await pool.query(
      `
      SELECT
        c.id,
        c.customer_type,
        c.company_name,
        c.tax_id,
        c.first_name,
        c.last_name,
        c.email,
        c.phone,
        c.city,
        c.postcode,
        c.credit_limit,
        c.payment_terms,
        c.created_at,
        c.status,

        COUNT(o.id) AS total_orders,
        COALESCE(SUM(o.total_amount), 0) AS total_spent

      FROM store_customers c
      LEFT JOIN store_orders o
        ON o.customer_id = c.id
        AND o.store_id = c.store_id

      WHERE c.id = $1
        AND c.store_id = $2

      GROUP BY c.id
      `,
      [customerId, store.id]
    );

    if (!result.rows.length) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      customer: result.rows[0],
    });

  } catch (error) {
    console.error("CUSTOMER DETAIL ERROR:", error);
    return NextResponse.json(
      { error: "Failed to fetch customer" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ customerId: string }> }

) {
  const store = await getCurrentStoreAPI(req);
  const body = await req.json();
  const { customerId } = await params;

  await pool.query(
    `
    UPDATE store_customers
    SET
      customer_type = $1,
      company_name = $2,
      tax_id = $3,
      first_name = $4,
      last_name = $5,
      email = $6,
      phone = $7,
      credit_limit = $8,
      payment_terms = $9
    WHERE id = $10
      AND store_id = $11
    `,
    [
      body.customer_type,
      body.company_name || null,
      body.tax_id || null,
      body.first_name,
      body.last_name,
      body.email,
      body.phone,
      body.credit_limit || 0,
      body.payment_terms || 0,
      customerId,
      store.id,
    ]
  );

  return NextResponse.json({ success: true });
}

/* export async function GET(
  _: Request,
  { params }: { params: Promise<{ customerId: string }> }
) {
  const { customerId } = await params;

  try {
    const customer = await pool.query(
      `
    SELECT
      c.*,
      COUNT(o.order_id) AS total_orders,
      COALESCE(SUM(o.total_amount), 0) AS total_spent
    FROM customers c
    LEFT JOIN orders o ON o.customer_id = c.customer_id
    WHERE c.customer_id = $1
    GROUP BY c.customer_id
    `,
      [customerId]
    );

    if (!customer.rows.length) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    const addresses = await pool.query(
      `SELECT * FROM customer_addresses WHERE customer_id = $1`,
      [customerId]
    );

    return NextResponse.json({
      customer: customer.rows[0],
      addresses: addresses.rows,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Failed to fetch customer", detail: e.message },
      { status: 500 }
    );
  }
} */
