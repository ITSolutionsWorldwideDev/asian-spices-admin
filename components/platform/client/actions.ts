// app/(platform)/client/actions.ts

"use server";

import { pool } from "@/core/db";
import { revalidatePath } from "next/cache";
import { requirePlatformAdminServer } from "@/lib/auth/server-guards";
import bcrypt from "bcryptjs";

interface RoleReferenceRow {
  id: string | number;
  key: string;
  name: string;
}

interface StoreAssignmentInput {
  store_id: string | number;
  role_id: string | number;
}

interface SaveUserFormData {
  email: string;
  name: string;
  password?: string;
  is_platform_admin: boolean;
  status: string;
  storeAssignments?: StoreAssignmentInput[];
}

export async function getReferenceData() {
  await requirePlatformAdminServer();

  try {
    // 1. Fetch active stores
    const storesRes = await pool.query(
      `SELECT id, name FROM stores WHERE status = 'active' ORDER BY name ASC`
    );

    // 2. Fetch only 'store' scoped roles for the assignments dropdown
    // We exclude 'platform' roles because those are handled by the is_platform_admin toggle
    const rolesRes = await pool.query<RoleReferenceRow>(
      `SELECT id, key, '' AS name FROM roles WHERE scope = 'store' ORDER BY key ASC`
    );

    return {
      stores: storesRes.rows,
      roles: rolesRes.rows.map(r => ({
        id: r.id,
        // Format the key for display (e.g., "store_admin" -> "Store Admin")
        name: r.name || r.key.split('_').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
      })),
    };
  } catch (error) {
    console.error("Failed to fetch reference data:", error);
    return { stores: [], roles: [] };
  }
}

export async function saveUserAction(userId: string | null, formData: SaveUserFormData) {
  const actor = await requirePlatformAdminServer();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    let finalUserId: string | number | null = userId;

    if (!userId) {
      // CREATE USER

      if (!formData.password) {
        throw new Error("Password is required for user creation");
      }

      const hashedPassword = await bcrypt.hash(formData.password, 10);
      const userRes = await client.query(
        `INSERT INTO users (email, name, password_hash, is_platform_admin, status)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [formData.email, formData.name, hashedPassword, formData.is_platform_admin, formData.status]
      );
      finalUserId = userRes.rows[0].id;
    } else {
      // UPDATE USER
      await client.query(
        `UPDATE users SET email = $1, name = $2, is_platform_admin = $3, status = $4 WHERE id = $5`,
        [formData.email, formData.name, formData.is_platform_admin, formData.status, userId]
      );
    }

    // SYNC STORE ASSIGNMENTS
    // Simplest way: Delete existing and re-insert (or use a delta)
    await client.query(`DELETE FROM store_users WHERE user_id = $1`, [finalUserId]);
    
    if (formData.storeAssignments && formData.storeAssignments?.length > 0) {
      for (const assign of formData.storeAssignments) {
        await client.query(
          `INSERT INTO store_users (store_id, user_id, role_id) VALUES ($1, $2, $3)`,
          [assign.store_id, finalUserId, assign.role_id]
        );
      }
    }

    await client.query("COMMIT");
    revalidatePath("/platform/users");
    return { success: true, id: finalUserId };
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

/* "use server";

import { pool } from "@/core/db";
import { revalidatePath } from "next/cache";
import { requirePlatformAdminServer } from "@/lib/auth/server-guards";

export async function createUser(data: {
  email: string;
  name?: string;
  password: string;
  is_platform_admin?: boolean;
  status?: "active" | "suspended";
}) {
  const actor = await requirePlatformAdminServer();

  const { rows } = await pool.query(
    `INSERT INTO users (email, name, password_hash, is_platform_admin, status)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [
      data.email,
      data.name,
      data.password, // hash later
      data.is_platform_admin ?? false,
      data.status ?? "active",
    ]
  );

  await pool.query(
    `INSERT INTO user_audit_logs (user_id, action, actor_id, changes)
     VALUES ($1, 'created', $2, $3)`,
    [rows[0].id, actor.id, JSON.stringify(data)]
  );

  revalidatePath("/platform/users");
}

export async function updateUser(userId: string, data: any) {
  const actor = await requirePlatformAdminServer();

  await pool.query(
    `UPDATE users SET email = $1 WHERE id = $2`,
    [data.email, userId]
  );

  await pool.query(
    `INSERT INTO user_audit_logs (user_id, action, actor_id)
     VALUES ($1, 'updated', $2)`,
    [userId, actor.id]
  );

  revalidatePath("/platform/users");
} */
