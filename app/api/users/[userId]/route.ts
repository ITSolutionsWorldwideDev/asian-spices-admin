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

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  const { userId } = await params;
  const actor = await requirePlatformAdmin();

  let actorId: string = actor.id;
  try {
    const body = await req.json();
    if (body?.actorId) actorId = String(body.actorId);
  } catch {
    // DELETE body is optional
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const existing = await client.query(
      `SELECT id, email FROM users WHERE id = $1 FOR UPDATE`,
      [userId],
    );

    if (existing.rows.length === 0) {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Keep customer/order history — only unlink login account
    await client.query(
      `UPDATE store_customers SET user_id = NULL WHERE user_id = $1`,
      [userId],
    );

    await client.query(`DELETE FROM store_users WHERE user_id = $1`, [userId]);

    // Clear other common user-owned rows.
    // Some legacy tables use integer user_id — skip those (22P02).
    // Use SAVEPOINT so one failed cleanup doesn't abort the whole transaction.
    const cleanupSql = [
      `DELETE FROM wishlists WHERE user_id::text = $1`,
      `DELETE FROM billing_addresses WHERE user_id::text = $1`,
      `DELETE FROM recipe_favorites WHERE user_id::text = $1`,
      `DELETE FROM store_cart_items WHERE user_id::text = $1`,
      `DELETE FROM notification_preferences WHERE user_id::text = $1`,
      `DELETE FROM user_notifications WHERE user_id::text = $1`,
      `DELETE FROM push_tokens WHERE user_id::text = $1`,
      `DELETE FROM login_audit WHERE user_id::text = $1`,
      `DELETE FROM email_change_tokens WHERE user_id::text = $1`,
      `DELETE FROM user_audit_logs WHERE user_id::text = $1 OR actor_id::text = $1`,
    ];

    for (let i = 0; i < cleanupSql.length; i++) {
      const savepoint = `cleanup_${i}`;
      try {
        await client.query(`SAVEPOINT ${savepoint}`);
        await client.query(cleanupSql[i], [userId]);
        await client.query(`RELEASE SAVEPOINT ${savepoint}`);
      } catch (err: any) {
        await client.query(`ROLLBACK TO SAVEPOINT ${savepoint}`);
        // 42P01 = missing table, 22P02 = UUID vs int, 42703 = missing column
        if (
          err?.code === "42P01" ||
          err?.code === "22P02" ||
          err?.code === "42703"
        ) {
          continue;
        }
        throw err;
      }
    }

    await client.query(`DELETE FROM users WHERE id = $1`, [userId]);

    // Log after delete into general audit (does not require users row)
    const auditActorId =
      actorId && actorId !== "system" ? actorId : actor.id;

    await client.query(
      `INSERT INTO audit_logs (actor_id, action, entity, entity_id, metadata)
       VALUES ($1, 'user.deleted', 'user', $2, $3)`,
      [
        auditActorId,
        userId,
        JSON.stringify({ email: existing.rows[0].email }),
      ],
    );

    await client.query("COMMIT");
    return NextResponse.json({ message: "User deleted" });
  } catch (err: any) {
    await client.query("ROLLBACK");
    console.error("DELETE user error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to delete user" },
      { status: 500 },
    );
  } finally {
    client.release();
  }
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