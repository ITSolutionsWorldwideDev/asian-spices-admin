// /app/api/related-products/route.ts (GET)

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/core/db";

export async function GET(req: NextRequest) {
  const productId = req.nextUrl.searchParams.get("product_id");

  if (!productId) {
    return NextResponse.json({ error: "Missing productId" }, { status: 400 });
  }

  const result = await pool.query(
    `SELECT product_id, displayname, price, stock_quantity, category_id, matchcode, itemid, image_url 
     FROM products AS i 
     where category_id in (SELECT p.category_id FROM products AS p WHERE p.product_id = $1) limit 10`,
    [productId]
  );

  const data: any = {};
  data.items = result.rows;
  return NextResponse.json(data);
}
