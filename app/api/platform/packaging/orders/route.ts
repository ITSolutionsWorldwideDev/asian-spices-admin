// app/api/platform/packaging/orders/route.ts

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/core/db";
import { requirePlatformAdmin } from "@/lib/auth/guards";

export async function PUT(req: NextRequest) {
  try {
    await requirePlatformAdmin();
    const body = await req.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json(
        { success: false, error: "Missing identity parameters" },
        { status: 400 },
      );
    }

    const validStatuses = ["pending", "packed", "shipped", "cancelled"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: "Invalid operational status variant value" },
        { status: 400 },
      );
    }

    const result = await pool.query(
      `
      UPDATE order_packaging
      SET packaging_status = $2, updated_at = NOW()
      WHERE id = $1
      RETURNING id, packaging_status as status
      `,
      [id, status],
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Packaging record entry missing" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
