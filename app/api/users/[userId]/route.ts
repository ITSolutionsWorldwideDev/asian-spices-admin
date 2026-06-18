// app/api/users/[userId]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/lib/auth/guards";
import { pool, buildUpdateQuery } from "@/core/db";


export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  const { userId } = await params;
  await requirePlatformAdmin();

  // 1. Fetch User Profile
  const userRes = await pool.query(
    `SELECT id, email, name, is_platform_admin, status FROM users WHERE id = $1`,
    [userId]
  );

  if (userRes.rows.length === 0) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // 2. Fetch User's Store Assignments
  const storesRes = await pool.query(
    `SELECT su.store_id, su.role_id, s.name as store_name, r.name as role_name
     FROM store_users su
     JOIN stores s ON s.id = su.store_id
     JOIN roles r ON r.id = su.role_id
     WHERE su.user_id = $1`,
    [userId]
  );

  return NextResponse.json({
    ...userRes.rows[0],
    stores: storesRes.rows,
  });
}
// export async function PUT(req: NextRequest, { params }: { params: { userId: string } }) {
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  await requirePlatformAdmin();
  const body = await req.json();

  const { userId } = await params;

  const { text, values } = buildUpdateQuery("users", body, {
    column: "id",
    // value: params.userId,
    value: userId,
  });

  const { rows } = await pool.query(text, values);

  // audit log
  await pool.query(
    `INSERT INTO user_audit_logs (user_id, action, actor_id, changes)
     VALUES ($1, 'updated', $2, $3)`,
    [
      userId,
      // params.userId,
      body.actorId,
      JSON.stringify(body),
    ],
  );

  return NextResponse.json(rows[0]);
}

// export async function DELETE(req: NextRequest, { params }: { params: { userId: string } }) {
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  const { userId } = await params;

  await requirePlatformAdmin();
  // await pool.query(`DELETE FROM users WHERE id = $1`, [params.userId]);
  await pool.query(`DELETE FROM users WHERE id = $1`, [userId]);

  // audit log
  const body = await req.json();
  await pool.query(
    `INSERT INTO user_audit_logs (user_id, action, actor_id)
     VALUES ($1, 'deleted', $2)`,
    [
      userId,
      // params.userId,
      body.actorId,
    ],
  );

  return NextResponse.json({ message: "User deleted" });
}


/* import { NextRequest, NextResponse } from "next/server";
import { pool, buildUpdateQuery } from "@/core/db";
import { requirePlatformAdmin } from "@/lib/auth/guards";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  const { userId } = await params;
  await requirePlatformAdmin();
  const { rows } = await pool.query(`SELECT * FROM users WHERE id = $1`, [
    userId,
  ]);
  // const { rows } = await pool.query(`SELECT * FROM users WHERE id = $1`, [params.userId]);
  return NextResponse.json(rows[0]);
}
 */