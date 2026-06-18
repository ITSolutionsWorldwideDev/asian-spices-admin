// app/api/roles/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/core/db";
import { roleSchema } from "@/lib/validations/roles";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const client = await pool.connect();
  const { id: roleId } = await params;

  try {
    const body = await req.json();
    const { key, scope, permissions } = roleSchema.parse(body);

    await client.query("BEGIN");

    // 1. Update Role basic info
    await client.query(
      `UPDATE roles SET key = $1, scope = $2 WHERE id = $3`,
      [key, scope, roleId]
    );

    // 2. Delete existing permissions
    await client.query(`DELETE FROM role_permissions WHERE role_id = $1`, [roleId]);

    // 3. Insert new permissions mapping
    if (permissions.length > 0) {
      const values = permissions.map((pId) => `('${roleId}', '${pId}')`).join(",");
      await client.query(`INSERT INTO role_permissions (role_id, permission_id) VALUES ${values}`);
    }

    await client.query("COMMIT");
    return NextResponse.json({ success: true });
  } catch (error) {
    await client.query("ROLLBACK");
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  } finally {
    client.release();
  }
}