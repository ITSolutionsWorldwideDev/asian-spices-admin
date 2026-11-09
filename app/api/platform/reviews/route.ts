import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { webAuthOptions } from "@/core/auth";
import { pool } from "@/core/db";

export async function GET() {
  const session = await getServerSession(webAuthOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { rows } = await pool.query(
    `SELECT id, rating, comment, status, guest_name, guest_email, created_at
     FROM store_product_reviews
     ORDER BY created_at DESC`,
  );

  return NextResponse.json(rows);
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(webAuthOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, status } = await req.json();
  if (!id || !["approved", "rejected", "pending"].includes(status)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  await pool.query(
    `UPDATE store_product_reviews SET status = $1, updated_at = NOW() WHERE id = $2`,
    [status, id],
  );

  return NextResponse.json({ success: true });
}
