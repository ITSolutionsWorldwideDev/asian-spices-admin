// /packages/auth/core/authorize.ts
import * as bcrypt from "bcryptjs";
import { runQuery } from "@/core/db";
import type { StoreRole } from "./types";

export interface AuthUser {
  id: string;
  email: string;
  isPlatformAdmin: boolean;
  storeRoles: {
    store_id: string;
    role: string;
    slug: string;
  }[];
}

export async function authorizeUser(email: string, password: string): Promise<AuthUser>{
  const userRes = await runQuery(
    `SELECT id, email, password_hash, is_platform_admin
     FROM users WHERE email = $1 AND status = 'active'`,
    [email]
  );

  const user = userRes.rows[0];

  if (!user) {
    throw new Error("Invalid credentials");
  }

  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) {
    throw new Error("Invalid credentials");
  }

  const rolesRes = await runQuery<{ store_id: string; role: string; slug: string }>(
    `SELECT su.store_id, r.key AS role, s.slug
     FROM store_users su
     JOIN stores s ON s.id = su.store_id
     JOIN roles r ON r.id = su.role_id
     WHERE su.user_id = $1`,
    [user.id]
  );

  // Platform admins aren't tied to a partner application. Everyone else must have
  // every store they belong to backed by an *approved* partner_registration - a
  // store created before approval (or never routed through the approval flow)
  // must not grant a working login. The FK linking stores back to their
  // application is inconsistent (some rows store partner_registration.partner_id,
  // others store partner_registration.application_id), so this checks both.
  if (!user.is_platform_admin && rolesRes.rows.length > 0) {
    const pendingRes = await runQuery(
      `SELECT 1
       FROM stores s
       JOIN partner_registration pr
         ON pr.partner_id::text = s.partner_registration_id
         OR pr.application_id = s.partner_registration_id
       WHERE s.id = ANY($1::uuid[])
         AND pr.status <> 'approved'
       LIMIT 1`,
      [rolesRes.rows.map((r) => r.store_id)]
    );

    if ((pendingRes.rowCount ?? 0) > 0) {
      throw new Error("Your account is pending approval");
    }
  }

  return {
    id: user.id,
    email: user.email,
    isPlatformAdmin: !!user.is_platform_admin,
    storeRoles: rolesRes.rows
  };
}
