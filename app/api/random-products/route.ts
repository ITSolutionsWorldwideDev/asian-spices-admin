// /app/api/related-products/route.ts (GET)

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/core/db";

export async function GET(req: NextRequest) {
  const result = await pool.query(
    `SELECT product_id, displayname, price, stock_quantity, category_id, matchcode, itemid, image_url 
     FROM products AS i 
     ORDER BY RANDOM()
     LIMIT 10`
  );

  const data: any = {};
  data.items = result.rows;
  return NextResponse.json(data);
}
