// apps/admin/app/api/platform/shipping/shipping-methods/route.ts

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/core/db";
import { requirePlatformAdmin } from "@/lib/auth/guards";

// GET ALL
export async function GET() {
  await requirePlatformAdmin();

  const { rows } = await pool.query(`
    SELECT sm.*, sp.name as provider_name
    FROM shipping_methods sm
    LEFT JOIN shipping_providers sp ON sp.id = sm.provider_id
    ORDER BY sm.created_at DESC
  `);

  return NextResponse.json({ methods: rows });
}

// CREATE
export async function POST(req: NextRequest) {
  await requirePlatformAdmin();

  const { name, code, provider_id, type } = await req.json();

  if (!name || !provider_id) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  const { rows } = await pool.query(
    `
    INSERT INTO shipping_methods 
      (name, code, provider_id, type)
    VALUES ($1, $2, $3, $4)
    RETURNING *
    `,
    [name, code, provider_id, type || "api"]
  );

  return NextResponse.json({ method: rows[0] });
}