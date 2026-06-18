// app/api/media/route.ts

import { getServerSession } from "next-auth";
import { adminAuthOptions } from "@/core/auth";
import { NextResponse, NextRequest } from "next/server";
import { pool } from "@/core/db";

// --------------------------
// GET - List or Single Media
// --------------------------

export async function GET(req: NextRequest) {
  // const session = await getServerSession(authOptions);
  const session = await getServerSession(adminAuthOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Parse and validate pagination bounds from URL query parameters
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.max(
    1,
    Math.min(100, parseInt(searchParams.get("limit") || "12", 10)),
  );

  const search = searchParams.get("search")?.trim() || "";

  const offset = (page - 1) * limit;

  try {
    // 1. Fetch total record count across your cluster
    // const countResult = await pool.query("SELECT COUNT(*) FROM media");
    const countResult = await pool.query(
      `
      SELECT COUNT(*)
      FROM media
      WHERE ($1 = '' OR file_name ILIKE $2)
      `,
      [search, `%${search}%`],
    );
    const totalRecords = parseInt(countResult.rows[0]?.count || "0", 10);
    const totalPages = Math.ceil(totalRecords / limit);

    // 2. Query the requested data window partition
    // const dataResult = await pool.query(
    //   `SELECT media_id, file_name, file_url, file_type, created_at
    //    FROM media
    //    ORDER BY created_at DESC
    //    LIMIT $1 OFFSET $2`,
    //   [limit, offset],
    // );

    const dataResult = await pool.query(
      `
      SELECT
        media_id,
        file_name,
        file_url,
        file_type,
        created_at
      FROM media
      WHERE ($1 = '' OR file_name ILIKE $2)
      ORDER BY created_at DESC
      LIMIT $3 OFFSET $4
      `,
      [search, `%${search}%`, limit, offset],
    );

    return NextResponse.json({
      media: dataResult.rows,
      pagination: {
        page,
        limit,
        totalRecords,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (err: any) {
    console.error("MEDIA FETCH ERROR:", err);
    return NextResponse.json(
      { error: "Failed to parse system assets" },
      { status: 500 },
    );
  }
}
// const result = await pool.query(
//   `SELECT media_id, file_name, file_url, file_type, created_at
//    FROM media
//    ORDER BY created_at DESC`
// );

// return NextResponse.json(result.rows);

// --------------------------
// DELETE - Delete Media File
// --------------------------

export async function DELETE(req: Request) {
  const session = await getServerSession(adminAuthOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing ID" }, { status: 400 });
  }

  await pool.query(`DELETE FROM media WHERE media_id = $1`, [id]);

  return NextResponse.json({ success: true });
}
