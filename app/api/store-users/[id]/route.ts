// apps/admin/app/api/store-users/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/core/db";
import { getCurrentStoreAPI } from "@/lib/auth/guards";
import { userSchema } from "@/lib/validations/user";


export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const store = await getCurrentStoreAPI(req);
    const { id: userId } = await params;

    const query = `
      SELECT u.id, u.name, u.email, u.is_platform_admin, u.status, su.role_id 
      FROM users u
      JOIN store_users su ON u.id = su.user_id
      WHERE u.id = $1 AND su.store_id = $2
    `;

    const result = await pool.query(query, [userId, store.id]);

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * UPDATE USER
 * Handles updating user details and their role within the store
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const client = await pool.connect();
  const { id: userId } = await params;

  try {
    const store = await getCurrentStoreAPI(req);
    const body = await req.json();
    const validated = userSchema.parse(body);

    await client.query("BEGIN");

    // 1. Verify user belongs to this store before updating
    const checkOwnership = await client.query(
      `SELECT 1 FROM store_users WHERE user_id = $1 AND store_id = $2`,
      [userId, store.id]
    );

    if (checkOwnership.rowCount === 0) {
      return NextResponse.json({ error: "User not found in this store" }, { status: 404 });
    }

    // 2. Update User Table (General Info)
    await client.query(
      `UPDATE users 
       SET name = $1, status = $2, is_platform_admin = $3, updated_at = NOW()
       WHERE id = $4`,
      [validated.name, validated.status, validated.is_platform_admin, userId]
    );

    // 3. Update Role in store_users table
    await client.query(
      `UPDATE store_users 
       SET role_id = $1, updated_at = NOW()
       WHERE user_id = $2 AND store_id = $3`,
      [validated.role_id, userId, store.id]
    );

    await client.query("COMMIT");
    return NextResponse.json({ success: true });

  } catch (error: any) {
    await client.query("ROLLBACK");
    console.error("UPDATE_USER_ERROR:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  } finally {
    client.release();
  }
}

/**
 * DELETE USER
 * Removes the relationship between the user and the store.
 * Note: Usually, we delete the store link, and only delete the user record 
 * if they aren't attached to any other stores.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const client = await pool.connect();
  const { id: userId } = await params;

  try {
    const store = await getCurrentStoreAPI(req);

    await client.query("BEGIN");

    // 1. Remove from store_users first (The relationship)
    const deleteRelation = await client.query(
      `DELETE FROM store_users WHERE user_id = $1 AND store_id = $2 RETURNING *`,
      [userId, store.id]
    );

    if (deleteRelation.rowCount === 0) {
      return NextResponse.json({ error: "User not found in this store" }, { status: 404 });
    }

    // 2. Optional: Check if user belongs to any OTHER stores. 
    // If not, you might want to hard-delete the user record or mark as deleted.
    const otherStores = await client.query(
      `SELECT 1 FROM store_users WHERE user_id = $1`,
      [userId]
    );

    if (otherStores.rowCount === 0) {
      await client.query(`DELETE FROM users WHERE id = $1`, [userId]);
    }

    await client.query("COMMIT");
    return NextResponse.json({ success: true });

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("DELETE_USER_ERROR:", error);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  } finally {
    client.release();
  }
}