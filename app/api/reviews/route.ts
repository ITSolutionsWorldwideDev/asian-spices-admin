// /app/api/reviews/route.ts (GET)

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/core/db";

export async function GET(req: NextRequest) {
  const productId = req.nextUrl.searchParams.get("product_id");

  if (!productId) {
    return NextResponse.json({ error: "Missing productId" }, { status: 400 });
  }

  const result = await pool.query(
    `SELECT review_id,comment, name,email, rating, review, created_at FROM product_reviews WHERE product_id = $1 ORDER BY created_at DESC`,
    [productId]
  );

  return NextResponse.json(result.rows);
}


// /app/api/reviews/route.ts (POST)

export async function POST(req: NextRequest) {
  const { productId, name, email, rating, review } = await req.json();

  if (!productId || !name || !rating || !review) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  await pool.query(
    `INSERT INTO product_reviews (product_id, name, email, rating, review) VALUES ($1, $2, $3, $4, $5)`,
    [productId, name, email, rating, review]
  );

  return NextResponse.json({ success: true });
}
