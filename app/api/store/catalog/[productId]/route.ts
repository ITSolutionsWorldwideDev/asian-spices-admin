// /app/api/store/catalog/[productId]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/core/db";
import { getCurrentStoreAPI } from "@/lib/auth/guards";

type Props = {
  params: Promise<{ productId: string }>;
};


export async function GET(
  req: NextRequest,
  { params }: Props
) {
  const client = await pool.connect();

  try {
    const { productId } = await params;

    const { rows } = await client.query(
      `
      SELECT 
        p.id,
        p.name,
        p.slug,
        p.sku,
        p.description,
        p.health_benefits,
        p.base_price,
        p.quantity,
        p.created_at
      FROM store_products p
      WHERE p.id = $1
      `,
      [productId]
    );

    if (!rows.length) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ product: rows[0] });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}