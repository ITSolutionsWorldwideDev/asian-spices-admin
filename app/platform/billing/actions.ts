"use server";

import { pool } from "@/core/db";
import { revalidatePath } from "next/cache";
import { requirePlatformAdminServer } from "@/lib/auth/server-guards";
import { randomUUID } from "crypto";

export async function createPlan(data: {
  name: string;
  price_cents: number;
  interval: "monthly" | "yearly";
  features: Record<string, boolean>;
}) {
  const actor = await requirePlatformAdminServer();

  await pool.query(
    `
    INSERT INTO plans (id, name, price_cents, interval, features)
    VALUES ($1, $2, $3, $4, $5)
    `,
    [
      randomUUID(),
      data.name,
      data.price_cents,
      data.interval,
      JSON.stringify(data.features)
    ]
  );

  revalidatePath("/platform/billing/plans");
}


export async function assignPlanToStore(
  storeId: string,
  planId: string
) {
  const actor = await requirePlatformAdminServer();

  await pool.query(
    `
    INSERT INTO subscriptions (id, store_id, plan_id, status, updated_at)
    VALUES ($1, $2, $3, 'active', now())
    ON CONFLICT (store_id)
    DO UPDATE SET
      plan_id = $3,
      status = 'active',
      updated_at = now()
    `,
    [randomUUID(), storeId, planId]
  );

  await pool.query(
    `
    INSERT INTO billing_audit_logs (store_id, actor_id, action, metadata)
    VALUES ($1, $2, 'plan_assigned', $3)
    `,
    [
      storeId,
      actor.id,
      JSON.stringify({ planId })
    ]
  );

  revalidatePath("/platform/billing");
}

export async function enforceBillingSuspensions() {
  await requirePlatformAdminServer();

  const { rows: overdueStores } = await pool.query(
    `
    SELECT DISTINCT store_id
    FROM invoices
    WHERE status = 'overdue'
      AND issued_at < now() - interval '7 days'
    `
  );

  for (const row of overdueStores) {
    await pool.query(
      `
      UPDATE stores
      SET status = 'suspended'
      WHERE id = $1
      `,
      [row.store_id]
    );

    await pool.query(
      `
      UPDATE subscriptions
      SET status = 'past_due'
      WHERE store_id = $1
      `,
      [row.store_id]
    );
  }

  return { suspended: overdueStores.length };
}
