// app/api/products/promos/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/lib/auth/guards";
import { pool } from "@/core/db";

/* ------------------ GET (List Promo Codes) ------------------ */
export async function GET(req: NextRequest) {
  await requirePlatformAdmin();

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search");

  const conditions: string[] = [];
  const values: any[] = [];

  if (search) {
    values.push(`%${search}%`);
    conditions.push(`code ILIKE $${values.length}`);
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const query = `
    SELECT * FROM store_promo_codes
    ${whereClause}
    ORDER BY created_at DESC
  `;

  try {
    const result = await pool.query(query, values);
    return NextResponse.json({ items: result.rows });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to fetch promo codes", details: error.message },
      { status: 500 },
    );
  }
}

/* ------------------ POST (Create Promo Code) ------------------ */
export async function POST(req: NextRequest) {
  await requirePlatformAdmin();

  try {
    const body = await req.json();
    const {
      code,
      discount_type,
      discount_value,
      min_order_amount,
      max_discount_amount,
      usage_limit,
      starts_at,
      expires_at,
      status,
    } = body;

    if (!code || !discount_type || !discount_value) {
      return NextResponse.json(
        { error: "Missing required tracking parameters" },
        { status: 400 },
      );
    }

    const query = `
      INSERT INTO store_promo_codes (
        code, discount_type, discount_value, min_order_amount, 
        max_discount_amount, usage_limit, starts_at, expires_at, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const values = [
      code.toUpperCase().trim(),
      discount_type,
      Number(discount_value),
      min_order_amount ? Number(min_order_amount) : 0,
      max_discount_amount ? Number(max_discount_amount) : null,
      usage_limit ? Number(usage_limit) : null,
      starts_at || new Date(),
      expires_at || null,
      status !== undefined ? Number(status) : 1,
    ];

    const result = await pool.query(query, values);
    return NextResponse.json({ success: true, item: result.rows[0] });
  } catch (error: any) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "Promo code configuration already exists" },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: "Database operational exception", details: error.message },
      { status: 500 },
    );
  }
}

/* ------------------ DELETE (Remove Promo Code) ------------------ */
export async function DELETE(req: NextRequest) {
  await requirePlatformAdmin();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id)
    return NextResponse.json(
      { error: "Missing reference ID" },
      { status: 400 },
    );

  try {
    await pool.query("DELETE FROM store_promo_codes WHERE id = $1", [id]);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Delete sequence failed", details: error.message },
      { status: 500 },
    );
  }
}
