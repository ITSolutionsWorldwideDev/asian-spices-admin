// apps/admin/app/api/platform/packaging/ribbons/route.ts

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/core/db";
import { requirePlatformAdmin } from "@/lib/auth/guards";

// Simple custom helper function to format a string into a URL-friendly/SKU safe block
function generateSku(name: string, color: string, width: number): string {
  const namePart = (name || "RBN").slice(0, 3).toUpperCase();
  const colorPart = (color || "CLR").slice(0, 3).toUpperCase();
  const widthPart = width ? `${width}MM` : "0MM";
  const randomPart = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${namePart}-${colorPart}-${widthPart}-${randomPart}`.replace(/[^A-Z0-9-]/g, "");
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
      where.push(`(name ILIKE $${values.length} OR sku ILIKE $${values.length} OR color ILIKE $${values.length})`);
    }

    const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const result = await pool.query(
      `
      SELECT 
        id, sku, name, color, material, width_mm, cost_price, is_active, created_at,
        COUNT(*) OVER() AS total
      FROM packaging_ribbons
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
    return NextResponse.json({ success: false, error: error.message || "Failed to fetch ribbons" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requirePlatformAdmin();

    const body = await req.json();
    const { name, color, material, width_mm, cost_price, is_active } = body;

    // Strict validation
    if (!name || typeof name !== "string" || name.trim() === "") {
      return NextResponse.json({ success: false, error: "Ribbon name is strictly required" }, { status: 400 });
    }

    // Auto-generate SKU if not explicitly provided or empty
    const sku = body.sku && body.sku.trim() !== "" 
      ? body.sku.trim().toUpperCase() 
      : generateSku(name, color, Number(width_mm || 0));

    // Double check unique constraint preview
    const existingSku = await pool.query("SELECT id FROM packaging_ribbons WHERE sku = $1", [sku]);
    if (existingSku.rows.length > 0) {
      return NextResponse.json({ success: false, error: `SKU "${sku}" already exists. Please choose a different key.` }, { status: 400 });
    }

    const result = await pool.query(
      `
      INSERT INTO packaging_ribbons
      (sku, name, color, material, width_mm, cost_price, is_active, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      RETURNING *
      `,
      [
        sku, 
        name.trim(), 
        color?.trim() || null, 
        material?.trim() || null, 
        Number(width_mm) || 0, 
        Number(cost_price) || 0, 
        is_active ?? true
      ]
    );

    return NextResponse.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to create ribbon" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await requirePlatformAdmin();

    const body = await req.json();
    const { id, name, color, material, width_mm, cost_price, is_active } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Missing identity key parameter" }, { status: 400 });
    }
    if (!name || typeof name !== "string" || name.trim() === "") {
      return NextResponse.json({ success: false, error: "Ribbon name is strictly required" }, { status: 400 });
    }

    const sku = body.sku && body.sku.trim() !== "" ? body.sku.trim().toUpperCase() : generateSku(name, color, Number(width_mm || 0));

    // Confirm duplicate SKU protection doesn't flag original item row ID
    const duplicateCheck = await pool.query("SELECT id FROM packaging_ribbons WHERE sku = $1 AND id != $2", [sku, id]);
    if (duplicateCheck.rows.length > 0) {
      return NextResponse.json({ success: false, error: `SKU "${sku}" matches another ribbon element inventory marker` }, { status: 400 });
    }

    const result = await pool.query(
      `
      UPDATE packaging_ribbons
      SET 
        sku = $2,
        name = $3,
        color = $4,
        material = $5,
        width_mm = $6,
        cost_price = $7,
        is_active = $8,
        updated_at = NOW()
      WHERE id = $1
      RETURNING *
      `,
      [
        id, 
        sku, 
        name.trim(), 
        color?.trim() || null, 
        material?.trim() || null, 
        Number(width_mm) || 0, 
        Number(cost_price) || 0, 
        is_active ?? true
      ]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ success: false, error: "Target ribbon record not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to update ribbon" }, { status: 500 });
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

    const result = await pool.query(`DELETE FROM packaging_ribbons WHERE id=$1 RETURNING id`, [id]);
    
    if (result.rows.length === 0) {
      return NextResponse.json({ success: false, error: "Ribbon record not found or already deleted" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Deletion failure" }, { status: 500 });
  }
}