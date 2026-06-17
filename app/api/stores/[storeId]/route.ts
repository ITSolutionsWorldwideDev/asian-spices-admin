// apps/admin/app/api/stores/[storeId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { buildUpdateQuery, pool } from "@/core/db";
import { requirePlatformAdmin } from "@/lib/auth/guards";

type RouteContext = {
  params: Promise<{
    storeId: string;
  }>;
};

export async function GET(_req: NextRequest, context: RouteContext) {
  await requirePlatformAdmin();
  const { storeId } = await context.params;

  const result = await pool.query(
    `SELECT 
      s.*, 
      pr.*
    FROM stores s
    LEFT JOIN partner_registration pr 
      ON pr.partner_id::text = s.partner_registration_id
    WHERE s.id = $1
    `,
    [storeId],
  );

  return NextResponse.json(result.rows[0]);
}

export async function PUT(req: NextRequest, context: RouteContext) {
  await requirePlatformAdmin();

  const { storeId } = await context.params;
  const body = await req.json();

  const { text, values } = buildUpdateQuery("stores", body, {
    column: "id",
    value: storeId,
  });

  const result = await pool.query(text, values);

  return NextResponse.json(result.rows[0]);
}

export async function DELETE(_req: NextRequest, context: RouteContext) {
  await requirePlatformAdmin();

  const { storeId } = await context.params;

  await pool.query(`DELETE FROM stores WHERE id = $1`, [storeId]);

  return NextResponse.json({ message: "Store deleted" });
}
