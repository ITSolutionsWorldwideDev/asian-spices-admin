// components/platform/settings/actions.ts

"use server";

import { pool } from "@/core/db";
import { revalidatePath } from "next/cache";
import { requirePlatformAdminServer } from "@/lib/auth/server-guards";

export async function updatePlatformSetting(
  key: string,
  value: unknown
) {
  const actor = await requirePlatformAdminServer();

  await pool.query(
    `
    INSERT INTO platform_settings (key, value, updated_by, updated_at)
    VALUES ($1, $2, $3, now())
    ON CONFLICT (key)
    DO UPDATE SET
      value = $2,
      updated_by = $3,
      updated_at = now()
    `,
    [key, JSON.stringify(value), actor.id]
  );

  revalidatePath("/settings");
}

