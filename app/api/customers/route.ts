// app/api/customers/route.ts

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/core/db";
import { getCurrentStoreAPI } from "@/lib/auth/guards";

export async function GET(req: NextRequest) {
  try {
    const store = await getCurrentStoreAPI(req);
    const { searchParams } = req.nextUrl;

    const search = searchParams.get("search");
    const customerType = searchParams.get("customer_type");
    const sort = searchParams.get("sort");

    const values: any[] = [store.id];
    let where = `WHERE c.store_id = $1`;

    /* SEARCH */
    if (search) {
      values.push(`%${search}%`);
      where += `
        AND (
          c.first_name ILIKE $${values.length}
          OR c.last_name ILIKE $${values.length}
          OR c.email ILIKE $${values.length}
          OR c.phone ILIKE $${values.length}
          OR c.company_name ILIKE $${values.length}
        )
      `;
    }

    /* CUSTOMER TYPE FILTER */
    if (customerType) {
      values.push(customerType);
      where += ` AND c.customer_type = $${values.length}`;
    }

    /* SORTING */
    let orderBy = "ORDER BY c.created_at DESC";
    if (sort === "date_asc") {
      orderBy = "ORDER BY c.created_at ASC";
    }

    const query = `
      SELECT
        c.id,
        c.customer_type,
        c.company_name,
        c.first_name,
        c.last_name,
        c.email,
        c.phone,
        c.city,
        c.postcode,
        c.credit_limit,
        c.payment_terms,
        c.created_at,

        COUNT(o.id) AS total_orders,
        COALESCE(SUM(o.total_amount), 0) AS total_spent

      FROM store_customers c
      LEFT JOIN store_orders o
        ON o.customer_id = c.id
        AND o.store_id = c.store_id

      ${where}

      GROUP BY c.id
      ${orderBy}
    `;

    const result = await pool.query(query, values);

    return NextResponse.json({
      items: result.rows,
    });
  } catch (error) {
    console.error("CUSTOMERS API ERROR:", error);
    return NextResponse.json(
      { error: "Failed to fetch customers" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const store = await getCurrentStoreAPI(req);
  const body = await req.json();

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const customerResult = await client.query(
      `
      INSERT INTO store_customers (
        store_id,
        customer_type,
        company_name,
        tax_id,
        first_name,
        last_name,
        email,
        phone,
        credit_limit,
        payment_terms
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING *
      `,
      [
        store.id,
        body.customer_type,
        body.company_name || null,
        body.tax_id || null,
        body.first_name,
        body.last_name,
        body.email,
        body.phone,
        body.credit_limit || 0,
        body.payment_terms || 0,
      ]
    );

    const customer = customerResult.rows[0];

    if (body.address) {
      await client.query(
        `
        INSERT INTO store_customer_addresses (
          store_id,
          customer_id,
          label,
          address_line1,
          address_line2,
          city,
          state,
          postal_code,
          country,
          is_default
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,true)
        `,
        [
          store.id,
          customer.id,
          body.address.label,
          body.address.address_line1,
          body.address.address_line2,
          body.address.city,
          body.address.state,
          body.address.postal_code,
          body.address.country,
        ]
      );
    }

    await client.query("COMMIT");

    return NextResponse.json({ customer });

  } catch (error) {
    await client.query("ROLLBACK");
    return NextResponse.json({ error: "Create failed" }, { status: 500 });
  } finally {
    client.release();
  }
}

/* export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  const search = searchParams.get("search");
  const status = searchParams.get("status");
  const sort = searchParams.get("sort");

  const values: any[] = [];
  let where = "WHERE 1=1";

  if (search) {
    values.push(`%${search}%`);
    where += `
      AND (
        c.first_name ILIKE $${values.length}
        OR c.last_name ILIKE $${values.length}
        OR c.email ILIKE $${values.length}
        OR c.phone ILIKE $${values.length}
      )
    `;
  }

  if (status) {
    values.push(status);
    where += ` AND c.status = $${values.length}`;
  }

  let orderBy = "ORDER BY c.created_at DESC";
  if (sort === "date_asc") orderBy = "ORDER BY c.created_at ASC";

  const query = `
    SELECT
      c.customer_id,
      c.first_name,
      c.last_name,
      c.email,
      c.phone,
      c.status,
      c.created_at,
      COUNT(o.order_id) AS total_orders,
      COALESCE(SUM(o.total_amount), 0) AS total_spent
    FROM customers c
    LEFT JOIN orders o ON o.customer_id = c.customer_id
    ${where}
    GROUP BY c.customer_id
    ${orderBy}
  `;

  const result = await pool.query(query, values);

  return NextResponse.json({
    items: result.rows,
  });
} */
