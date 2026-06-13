// apps/admin/lib/auth/server-guards.ts
import { requirePlatformAdmin } from "./guards";

export async function requirePlatformAdminServer() {
  const user = await requirePlatformAdmin();

  return user;
}
