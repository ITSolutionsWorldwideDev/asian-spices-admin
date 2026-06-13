// apps/admin/app/api/platform/packaging/rules/route.ts

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/core/db";
import { requirePlatformAdmin } from "@/lib/auth/guards";

export async function GET() {
  try {
    await requirePlatformAdmin();

    const result = await pool.query(`
      SELECT 
        pr.id, pr.name, pr.packaging_type_id, pr.min_weight_kg, pr.max_weight_kg,
        pr.min_order_amount, pr.max_order_amount, pr.priority, pr.is_active,
        pt.name as packaging_name
      FROM packaging_rules pr
      LEFT JOIN packaging_types pt ON pt.id = pr.packaging_type_id
      ORDER BY pr.priority ASC, pr.created_at DESC
    `);

    return NextResponse.json({ success: true, data: result.rows });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requirePlatformAdmin();
    const body = await req.json();
    const { name, packaging_type_id, min_weight_kg, max_weight_kg, min_order_amount, max_order_amount, priority, is_active } = body;

    if (!name?.trim()) {
      return NextResponse.json({ success: false, error: "Rule identity name is required" }, { status: 400 });
    }
    if (!packaging_type_id) {
      return NextResponse.json({ success: false, error: "Target package selection reference assignment missing" }, { status: 400 });
    }

    const result = await pool.query(
      `
      INSERT INTO packaging_rules (
        name, packaging_type_id, min_weight_kg, max_weight_kg, 
        min_order_amount, max_order_amount, priority, is_active
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
      `,
      [
        name.trim(),
        packaging_type_id,
        Number(min_weight_kg) || 0,
        max_weight_kg === "" || max_weight_kg === null ? null : Number(max_weight_kg),
        Number(min_order_amount) || 0,
        max_order_amount === "" || max_order_amount === null ? null : Number(max_order_amount),
        Integer(priority) || 0,
        is_active ?? true
      ]
    );

    return NextResponse.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await requirePlatformAdmin();
    const body = await req.json();
    const { id, name, packaging_type_id, min_weight_kg, max_weight_kg, min_order_amount, max_order_amount, priority, is_active } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Missing entity identity parameter" }, { status: 400 });
    }
    if (!name?.trim()) {
      return NextResponse.json({ success: false, error: "Rule identity name is required" }, { status: 400 });
    }

    const result = await pool.query(
      `
      UPDATE packaging_rules
      SET 
        name = $2, packaging_type_id = $3, min_weight_kg = $4, max_weight_kg = $5,
        min_order_amount = $6, max_order_amount = $7, priority = $8, is_active = $9,
        updated_at = NOW()
      WHERE id = $1
      RETURNING *
      `,
      [
        id,
        name.trim(),
        packaging_type_id || null,
        Number(min_weight_kg) || 0,
        max_weight_kg === "" || max_weight_kg === null ? null : Number(max_weight_kg),
        Number(min_order_amount) || 0,
        max_order_amount === "" || max_order_amount === null ? null : Number(max_order_amount),
        Integer(priority) || 0,
        is_active ?? true
      ]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ success: false, error: "Rule modification point missing" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requirePlatformAdmin();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Target ID identifier missing" }, { status: 400 });
    }

    const result = await pool.query("DELETE FROM packaging_rules WHERE id = $1 RETURNING id", [id]);
    
    if (result.rows.length === 0) {
      return NextResponse.json({ success: false, error: "Record deletion target vanished" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

function Integer(val: any) {
  return parseInt(val, 10);
}