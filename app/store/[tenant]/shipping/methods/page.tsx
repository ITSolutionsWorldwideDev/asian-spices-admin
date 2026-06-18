// app/store/[tenant]/shipping/methods/page.tsx
import { pool } from "@/core/db";
import { getCurrentStore } from "@/lib/auth/guards";
import MethodsClient from "@/components/shipping/methods/MethodsClient";

export default async function ShippingMethodsPage() {
  const store = await getCurrentStore();

  const { rows } = await pool.query(
    `
    SELECT sm.*, sp.name as provider_name
    FROM shipping_methods sm
    LEFT JOIN shipping_providers sp ON sp.id = sm.provider_id
    WHERE sm.store_id = $1
    ORDER BY sm.created_at DESC
    `,
    [store.id]
  );

  return (
    <div className="page-wrapper">
      <div className="content">
        <MethodsClient methods={rows} />
      </div>
    </div>
  );
}