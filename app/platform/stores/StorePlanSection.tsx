// apps/admin/app/(platform)/platform/stores/StorePlanSection.tsx

import { pool } from "@/core/db";
import StorePlanSelectorClient from "@/components/platform/billing/StorePlanSelectorClient";
// import StorePlanSectionClient from "./StorePlanSectionClient";

export default async function StorePlanSection({
  storeId,
  currentPlanId,
  currentPlanName,
}: {
  storeId: string;
  currentPlanId: string | null;
  currentPlanName: string | null;
}) {
  const { rows: plans } = await pool.query(
    `SELECT id, name FROM plans WHERE is_active = true`
  );

  return (
    <StorePlanSelectorClient
      storeId={storeId}
      plans={plans}
      currentPlanId={currentPlanId}
      currentPlanName={currentPlanName}
    />
  );
}
