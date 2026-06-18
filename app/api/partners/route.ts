// app/api/partners/route.ts

import { NextRequest, NextResponse } from "next/server";
import { buildInsertQuery, pool } from "@/core/db";
import { requirePlatformAdmin } from "@/lib/auth/guards";

export async function GET() {
  await requirePlatformAdmin();

  const result = await pool.query(
    `SELECT * FROM partner_registration
    ORDER BY created_at DESC`,
  );
  return NextResponse.json(result.rows);
}
