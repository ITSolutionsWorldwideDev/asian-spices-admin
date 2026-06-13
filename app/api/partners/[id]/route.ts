// /api/platform/partners/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { buildUpdateQuery, pool } from "@/core/db";
import { requirePlatformAdmin } from "@/lib/auth/guards";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_req: NextRequest, context: RouteContext) {
  await requirePlatformAdmin();
  const { id } = await context.params;

  const result = await pool.query(`SELECT * FROM partner_registration WHERE partner_id = $1`, [
    id,
  ]);

  return NextResponse.json(result.rows[0]);
}