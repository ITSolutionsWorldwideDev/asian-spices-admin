// app/api/roles/route.ts

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/core/db";
import { roleSchema } from "@/lib/validations/roles";

export async function POST(req: NextRequest) {
  const client = await pool.connect();

  try {
    const body = await req.json();
    const { key, scope, permissions } = roleSchema.parse(body);

    await client.query("BEGIN");

    // 1. Insert Role
    const roleResult = await client.query(
      "INSERT INTO roles (key, scope) VALUES ($1, $2) RETURNING id",
      [key, scope]
    );
    const roleId = roleResult.rows[0].id;

    // 2. Bulk Insert Permissions
    if (permissions && permissions.length > 0) {
      // Create ($1, $2), ($1, $3) pattern for bulk insert
      const values = permissions.map((_, i) => `($1, $${i + 2})`).join(",");
      const query = `INSERT INTO role_permissions (role_id, permission_id) VALUES ${values}`;
      await client.query(query, [roleId, ...permissions]);
    }

    await client.query("COMMIT");
    return NextResponse.json({ id: roleId }, { status: 201 });
  } catch (error: any) {
    await client.query("ROLLBACK");
    console.error("ROLE_POST_ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}