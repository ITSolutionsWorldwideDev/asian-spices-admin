// apps/admin/lib/auth/guards.ts

import { redirect, notFound } from "next/navigation";
import { headers } from "next/headers";
import { pool } from "@/core/db";
import { getSessionUser } from "./getSession";
import type { PermissionKey } from "./permissions";
import { NextRequest } from "next/server";

/**
 * Layer 1: User must be authenticated
 */
export async function requireAuth() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}
// export async function requireAuth() {
//   return getSessionUser();
// }

/**
 * Layer 2: Platform admin only
 */
export async function requirePlatformAdmin() {
  const user = await requireAuth();

  if (!user.isPlatformAdmin) {
    redirect("/unauthorized");
  }

  return user;
}

/**
 * ===============================
 * Resolve Current Store (Subdomain Based)
 * ===============================
 */
export async function getCurrentStore() {
  const headersList = await headers();
  const subdomain = headersList.get("x-tenant-subdomain");

  // console.log('getCurrentStore subdomain ==== ',subdomain);

  if (!subdomain) {
    notFound();
  }

  const storeRes = await pool.query(
    `SELECT id, name, status FROM stores WHERE slug = $1 LIMIT 1`,
    [subdomain],
  );

  if (!storeRes.rowCount) {
    notFound();
  }

  const store = storeRes.rows[0];

  if (store.status === "suspended") {
    redirect("/store-suspended");
  }

  return store; // { id, name, status }
}

export async function getCurrentStoreFromPath(pathname: string) {
  const parts = pathname.split("/");

  // console.log('parts ',parts);
  // Expecting: /store/{tenant}/...
  const subdomain = parts[2];

  // console.log('subdomain ',subdomain);

  if (!subdomain) {
    notFound();
  }

  const storeRes = await pool.query(
    `SELECT id, name, status FROM stores WHERE slug = $1 LIMIT 1`,
    [subdomain]
  );

  if (!storeRes.rowCount) notFound();

  const store = storeRes.rows[0];

  // console.log('store db ',store);

  if (store.status === "suspended") {
    redirect("/store-suspended");
  }

  return store;
}

/**
 * ===============================
 * Layer 3: Store Access (Membership)
 * ===============================
 */
export async function requireStoreAccess(tenantSlug: string) { //  permission: PermissionKey

  const user = await requireAuth();
  const store = tenantSlug ? await getStoreBySlug(tenantSlug) : await getCurrentStore();

  // const [user, store] = await Promise.all([requireAuth(), getCurrentStore()]);

  // Platform admin bypass
  if (user.isPlatformAdmin) {
    return store;
  }

  const membership = await pool.query(
    `
    SELECT 1
    FROM store_users
    WHERE user_id = $1
      AND store_id = $2
    LIMIT 1
    `,
    [user.id, store.id],
  );

  if (!membership.rowCount) {
    redirect("/unauthorized");
  }

  return store;
}

/**
 * ===============================
 * Layer 4: Store Permission
 * ===============================
 */
export async function requireStorePermission(permission: PermissionKey) {
  const user = await requireAuth();
  const store = await getCurrentStore();

  // Platform admin bypass
  if (user.isPlatformAdmin) {
    return store;
  }

  const { rowCount } = await pool.query(
    `
    SELECT 1
    FROM store_users su
    JOIN role_permissions rp ON rp.role_id = su.role_id
    JOIN permissions p ON p.id = rp.permission_id
    WHERE su.user_id = $1
      AND su.store_id = $2
      AND p.key = $3
    LIMIT 1
    `,
    [user.id, store.id, permission],
  );

  if (!rowCount) {
    redirect("/unauthorized");
  }

  return store;
}

export async function requireStorePermission2(permission: PermissionKey, tenantSlug?: string) {
  const user = await requireAuth();

  const store = tenantSlug ? await getStoreBySlug(tenantSlug) : await getCurrentStore();

  if (user.isPlatformAdmin) return store;

  const { rowCount } = await pool.query(
    `SELECT 1
     FROM store_users su
     JOIN role_permissions rp ON rp.role_id = su.role_id
     JOIN permissions p ON p.id = rp.permission_id
     WHERE su.user_id = $1 AND su.store_id = $2 AND p.key = $3
     LIMIT 1`,
    [user.id, store.id, permission]
  );

  if (!rowCount) redirect("/unauthorized");

  return store;
}

async function getStoreBySlug(slug: string) {
  const res = await pool.query(
    `SELECT id, name, status FROM stores WHERE slug = $1 LIMIT 1`,
    [slug]
  );

  if (!res.rowCount) redirect("/store-not-found");
  const store = res.rows[0];
  if (store.status === "suspended") redirect("/store-suspended");
  return store;
}

/* export async function requireStorePermission2(
  tenant: string,
  permission: PermissionKey
) {
  const user = await requireAuth();

  const storeRes = await pool.query(
    `SELECT id, name, status FROM stores WHERE slug = $1 LIMIT 1`,
    [tenant]
  );

  if (!storeRes.rowCount) {
    notFound();
  }

  const store = storeRes.rows[0];

  if (store.status === "suspended") {
    redirect("/store-suspended");
  }

  if (user.isPlatformAdmin) {
    return store;
  }

  const { rowCount } = await pool.query(
    `
    SELECT 1
    FROM store_users su
    JOIN role_permissions rp ON rp.role_id = su.role_id
    JOIN permissions p ON p.id = rp.permission_id
    WHERE su.user_id = $1
      AND su.store_id = $2
      AND p.key = $3
    LIMIT 1
    `,
    [user.id, store.id, permission]
  );

  if (!rowCount) {
    redirect("/unauthorized");
  }

  return store;
} */

/* export async function getCurrentStoreAPI(req: NextRequest) {
  const subdomain = req.headers.get("x-tenant-subdomain");
  if (!subdomain) throw new Error("STORE_SUBDOMAIN_MISSING");

  const storeRes = await pool.query(
    `SELECT id, name, status FROM stores WHERE slug = $1 LIMIT 1`,
    [subdomain],
  );

  if (!storeRes.rowCount) throw new Error("STORE_NOT_FOUND");

  const store = storeRes.rows[0];

  if (store.status === "suspended") throw new Error("STORE_SUSPENDED");

  return store;
} */


export async function getCurrentStoreAPI(req: NextRequest) {

  let slug = req.headers.get("x-tenant-subdomain");

  if (!slug) {
    const url = new URL(req.url);
    const parts = url.pathname.split("/"); 

    if (parts.includes("store")) {
      slug = parts[parts.indexOf("store") + 1];
    }
  }

  if (!slug) {
    console.error("DEBUG: Subdomain missing at path", req.nextUrl.pathname);
    throw new Error("STORE_SUBDOMAIN_MISSING");
  }

  const storeRes = await pool.query(
    `SELECT id, name, status FROM stores WHERE slug = $1 LIMIT 1`,
    [slug]
  );

  if (!storeRes.rowCount) throw new Error("STORE_NOT_FOUND");

  const store = storeRes.rows[0];
  if (store.status === "suspended") throw new Error("STORE_SUSPENDED");

  return store;
}

/**
 * Layer 3: Store + permission based access
 */
/* export async function requireStorePermission(
  storeId: string,
  permission: PermissionKey
) {
  const user = await requireAuth();

  // Platform admins bypass store checks
  if (user.isPlatformAdmin) return;

  const { rowCount } = await pool.query(
    `
    SELECT 1
    FROM store_users su
    JOIN roles r ON r.id = su.role_id
    JOIN role_permissions rp ON rp.role_id = r.id
    JOIN permissions p ON p.id = rp.permission_id
    WHERE su.user_id = $1
      AND su.store_id = $2
      AND p.key = $3
    `,
    [user.id, storeId, permission]
  );

  if (!rowCount) {
    redirect("/unauthorized");
  }
} */
