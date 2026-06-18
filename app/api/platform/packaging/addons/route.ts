// app/api/platform/packaging/addons/route.ts

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/core/db";
import { requirePlatformAdmin } from "@/lib/auth/guards";

function generateAddonSku(name: string, type: string): string {
  const namePart = (name || "ADD").slice(0, 3).toUpperCase();
  const typePart = (type || "GEN").slice(0, 3).toUpperCase();
  const randomPart = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `ADD-${namePart}-${typePart}-${randomPart}`.replace(/[^A-Z0-9-]/g, "");
}

export async function GET(req: NextRequest) {
  try {
    await requirePlatformAdmin();

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const q = searchParams.get("q") || "";
    const limit = 10;
    const offset = (page - 1) * limit;

    const values: any[] = [];
    const where: string[] = [];

    if (q) {
      values.push(`%${q}%`);
      where.push(`(name ILIKE $${values.length} OR sku ILIKE $${values.length} OR addon_type ILIKE $${values.length})`);
    }

    const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const result = await pool.query(
      `
      SELECT 
        id, sku, name, addon_type, description, cost_price, is_active, created_at,
        COUNT(*) OVER() AS total
      FROM packaging_addons
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
      `,
      values
    );

    return NextResponse.json({
      success: true,
      data: result.rows,
      total: result.rows[0]?.total || 0,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to fetch addons" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requirePlatformAdmin();

    const body = await req.json();
    const { name, addon_type, description, cost_price, is_active } = body;

    if (!name || typeof name !== "string" || name.trim() === "") {
      return NextResponse.json({ success: false, error: "Addon name is required" }, { status: 400 });
    }

    const sku = body.sku && body.sku.trim() !== "" 
      ? body.sku.trim().toUpperCase() 
      : generateAddonSku(name, addon_type);

    const existingSku = await pool.query("SELECT id FROM packaging_addons WHERE sku = $1", [sku]);
    if (existingSku.rows.length > 0) {
      return NextResponse.json({ success: false, error: `SKU "${sku}" already exists.` }, { status: 400 });
    }

    const result = await pool.query(
      `
      INSERT INTO packaging_addons
      (sku, name, addon_type, description, cost_price, is_active, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      RETURNING *
      `,
      [
        sku,
        name.trim(),
        addon_type || "custom",
        description?.trim() || null,
        Number(cost_price) || 0,
        is_active ?? true
      ]
    );

    return NextResponse.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to create addon" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await requirePlatformAdmin();

    const body = await req.json();
    const { id, name, addon_type, description, cost_price, is_active } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Missing addon identity element" }, { status: 400 });
    }
    if (!name || typeof name !== "string" || name.trim() === "") {
      return NextResponse.json({ success: false, error: "Addon name is required" }, { status: 400 });
    }

    const sku = body.sku && body.sku.trim() !== "" 
      ? body.sku.trim().toUpperCase() 
      : generateAddonSku(name, addon_type);

    const duplicateCheck = await pool.query("SELECT id FROM packaging_addons WHERE sku = $1 AND id != $2", [sku, id]);
    if (duplicateCheck.rows.length > 0) {
      return NextResponse.json({ success: false, error: `SKU "${sku}" is being used by another addon.` }, { status: 400 });
    }

    const result = await pool.query(
      `
      UPDATE packaging_addons
      SET 
        sku = $2,
        name = $3,
        addon_type = $4,
        description = $5,
        cost_price = $6,
        is_active = $7,
        updated_at = NOW()
      WHERE id = $1
      RETURNING *
      `,
      [
        id,
        sku,
        name.trim(),
        addon_type || "custom",
        description?.trim() || null,
        Number(cost_price) || 0,
        is_active ?? true
      ]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ success: false, error: "Target addon record not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to update addon" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requirePlatformAdmin();

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Missing id" }, { status: 400 });
    }

    const result = await pool.query(`DELETE FROM packaging_addons WHERE id=$1 RETURNING id`, [id]);
    
    if (result.rows.length === 0) {
      return NextResponse.json({ success: false, error: "Record not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Deletion failure" }, { status: 500 });
  }
}