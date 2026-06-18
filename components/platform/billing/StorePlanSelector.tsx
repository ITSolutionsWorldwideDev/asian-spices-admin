// components/platform/billing/StorePlanSelector.tsx

import { pool } from "@/core/db";
import { requirePlatformAdmin } from "@/lib/auth/guards";
import StorePlanSelectorClient from "./StorePlanSelectorClient";

export default async function StorePlanSelector() {
  await requirePlatformAdmin();

  const [{ rows: stores }, { rows: plans }] = await Promise.all([
    pool.query(`
      SELECT s.id, s.name, sub.plan_id
      FROM stores s
      LEFT JOIN subscriptions sub ON sub.store_id = s.id
      ORDER BY s.name ASC
    `),
    pool.query(`
      SELECT id, name FROM plans
      WHERE is_active = true
    `)
  ]);

  return (
    <StorePlanSelectorClient
      stores={stores}
      plans={plans}
    />
  );
}
