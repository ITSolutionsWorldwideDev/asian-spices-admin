// app/api/customers/[customerId]/status/route.ts
import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/core/db";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ customerId: string }> }
) {
  const { customerId } = await params;

  try {
    const body = await req.json();
    const { status } = body;

    if (typeof status !== "number") {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    await pool.query(
      `
    UPDATE store_customers
    SET status = $1, updated_at = NOW()
    WHERE customer_id = $2
    `,
      [status, customerId]
    );

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Failed to update status", detail: e.message },
      { status: 500 }
    );
  }
}
