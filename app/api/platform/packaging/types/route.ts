// app/api/platform/packaging/types/route.ts

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/core/db";
import { requirePlatformAdmin } from "@/lib/auth/guards";
import { packagingTypeSchema } from "@/lib/validations/packaging";

export async function GET(req: NextRequest) {
  await requirePlatformAdmin();

  const { searchParams } = new URL(req.url);

  const page = Number(searchParams.get("page") || 1);
  const q = searchParams.get("q") || "";
  const limit = 10;
  const offset = (page - 1) * limit;

  const values: any[] = [];
  const where: string[] = [];

  if (q) {
    values.push(`%${q}%`);
    where.push(
      `(name ILIKE $${values.length} OR sku ILIKE $${values.length} OR package_type ILIKE $${values.length})`,
    );
  }

  const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

  try {
    const result = await pool.query(
      `
    SELECT *,
      COUNT(*) OVER() AS total
    FROM packaging_types
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT ${limit} OFFSET ${offset}
    `,
      values,
    );

    return NextResponse.json({
      success: true,
      data: result.rows,
      total: result.rows[0]?.total || 0,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  await requirePlatformAdmin();

  try {
    const body = await req.json();
    const parsed = packagingTypeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          fields: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const {
      name,
      sku,
      package_type,
      description,
      length_cm,
      width_cm,
      height_cm,
      empty_weight_kg,
      max_weight_kg,
      material,
      color,
      is_fragile,
      is_active,
    } = parsed.data;

    const result = await pool.query(
      `INSERT INTO packaging_types 
       (name, sku, package_type, description, length_cm, width_cm, height_cm, empty_weight_kg, max_weight_kg, material, color, is_fragile, is_active) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) 
       RETURNING *`,
      [
        name,
        sku.toUpperCase(),
        package_type,
        description,
        length_cm,
        width_cm,
        height_cm,
        empty_weight_kg,
        max_weight_kg || null,
        material,
        color,
        is_fragile,
        is_active,
      ],
    );

    return NextResponse.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    if (error.code === "23505") {
      return NextResponse.json(
        {
          success: false,
          error: "A packaging rule matching this unique SKU already exists.",
        },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { success: false, error: error.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function PUT(req: NextRequest) {
  await requirePlatformAdmin();

  try {
    const body = await req.json();
    const parsed = packagingTypeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          fields: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const {
      id,
      name,
      sku,
      package_type,
      description,
      length_cm,
      width_cm,
      height_cm,
      empty_weight_kg,
      max_weight_kg,
      material,
      color,
      is_fragile,
      is_active,
    } = parsed.data;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Missing type identification ID parameter." },
        { status: 400 },
      );
    }

    const result = await pool.query(
      `UPDATE packaging_types 
       SET name=$2, sku=$3, package_type=$4, description=$5, length_cm=$6, width_cm=$7, height_cm=$8, empty_weight_kg=$9, max_weight_kg=$10, material=$11, color=$12, is_fragile=$13, is_active=$14, updated_at=NOW() 
       WHERE id=$1 
       RETURNING *`,
      [
        id,
        name,
        sku.toUpperCase(),
        package_type,
        description,
        length_cm,
        width_cm,
        height_cm,
        empty_weight_kg,
        max_weight_kg || null,
        material,
        color,
        is_fragile,
        is_active,
      ],
    );

    if (!result.rowCount) {
      return NextResponse.json(
        {
          success: false,
          error: "Packaging type target reference context not found.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    if (error.code === "23505") {
      return NextResponse.json(
        {
          success: false,
          error:
            "Another entity configuration is already utilizing this generated SKU code identifier.",
        },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  await requirePlatformAdmin();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { success: false, error: "Missing id payload reference string" },
      { status: 400 },
    );
  }

  try {
    await pool.query(`DELETE FROM packaging_types WHERE id=$1`, [id]);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
