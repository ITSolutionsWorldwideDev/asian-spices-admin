// app/api/media/save/route.ts

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/core/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { file_name, file_url, file_type, size } = body;

    if (!file_url) {
      return NextResponse.json(
        { error: "Missing file_url" },
        { status: 400 }
      );
    }

    // 🔒 basic validation (IMPORTANT)
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file_type)) {
      return NextResponse.json(
        { error: "Invalid file type" },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `INSERT INTO media
        (file_name, file_url, file_type, size)
       VALUES ($1, $2, $3, $4)
       RETURNING media_id`,
      [file_name, file_url, file_type, size]
    );

    return NextResponse.json({
      success: true,
      mediaId: result.rows[0].media_id,
    });
  } catch (err) {
    console.error("MEDIA SAVE ERROR:", err);
    return NextResponse.json(
      { error: "Failed to save media" },
      { status: 500 }
    );
  }
}