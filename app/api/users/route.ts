// apps/admin/app/api/users/route.ts
import { NextRequest, NextResponse } from "next/server";
import { pool, buildInsertQuery } from "@/core/db";
import { requirePlatformAdmin } from "@/lib/auth/guards";

// GET /api/users?page=1&search=email
export async function GET(req: NextRequest) {
  await requirePlatformAdmin();

  const url = new URL(req.url);
  const page = Number(url.searchParams.get("page") ?? 1);
  const search = url.searchParams.get("search") || "";
  const PAGE_SIZE = 10;
  const offset = (page - 1) * PAGE_SIZE;

  const where: string[] = [];
  const values: any[] = [];

  if (search) {
    values.push(`%${search}%`);
    where.push(`email ILIKE $${values.length}`);
  }

  const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const { rows } = await pool.query(
    `SELECT id, email, name, is_platform_admin, status, created_at
     FROM users
     ${whereClause}
     ORDER BY created_at DESC
     LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
    [...values, PAGE_SIZE, offset]
  );

  const { rows: totalRows } = await pool.query(
    `SELECT COUNT(*) FROM users ${whereClause}`,
    values
  );

  return NextResponse.json({
    items: rows,
    total: Number(totalRows[0].count),
    page,
    pageSize: PAGE_SIZE,
  });
}

// POST /api/users
export async function POST(req: NextRequest) {
  await requirePlatformAdmin();

  const body = await req.json();
  const { text, values } = buildInsertQuery("users", {
    email: body.email,
    name: body.name,
    password_hash: body.password, // hash before saving in real case
    is_platform_admin: body.is_platform_admin ?? false,
    status: body.status ?? "active",
  });

  const { rows } = await pool.query(text, values);

  // audit log
  await pool.query(
    `INSERT INTO user_audit_logs (user_id, action, actor_id, changes)
     VALUES ($1, 'created', $2, $3)`,
    [rows[0].id, body.actorId, JSON.stringify(body)]
  );

  return NextResponse.json(rows[0]);
}

/* export async function GET() {
  await requirePlatformAdmin();

  const result = await pool.query(`SELECT * FROM users ORDER BY created_at DESC`);
  return NextResponse.json(result.rows);
}

export async function POST(req: NextRequest) {
  await requirePlatformAdmin();
  const body = await req.json();

  const { text, values } = buildInsertQuery("users", body);
  const result = await pool.query(text, values);

  return NextResponse.json(result.rows[0]);
}
 */
