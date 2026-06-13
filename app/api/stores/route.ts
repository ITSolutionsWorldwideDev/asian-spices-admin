// apps/admin/app/api/stores/route.ts
import { NextRequest, NextResponse } from "next/server";
import { buildInsertQuery, pool } from "@/core/db";
import { requirePlatformAdmin } from "@/lib/auth/guards";

export async function GET() {
  await requirePlatformAdmin();

  const result = await pool.query(
    `SELECT * FROM stores ORDER BY created_at DESC`,
  );
  return NextResponse.json(result.rows);
}

export async function POST(req: NextRequest) {
  await requirePlatformAdmin();
  const body = await req.json();

  const { text, values } = buildInsertQuery("stores", {
    name: body.name,
    owner_email: body.ownerEmail,
  });

  const result = await pool.query(text, values);

  // const result = await pool.query(
  //   `INSERT INTO stores (name, owner_email) VALUES ($1, $2) RETURNING *`,
  //   [body.name, body.ownerEmail]
  // );

  return NextResponse.json(result.rows[0]);
}
