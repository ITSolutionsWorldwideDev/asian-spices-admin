// 📁 apps/admin/app/platform/shipping/methods/[methodId]/rates/page.tsx

import { pool } from "@/core/db";
import { requirePlatformAdmin } from "@/lib/auth/guards";
import RatesManager from "@/components/platform/shipping/RatesManager";

export default async function ShippingRatesPage({
  params,
}: {
  params: Promise<{ methodId: string }>;
}) {
  await requirePlatformAdmin();

  const { methodId } = await params;

  // Get method info
  const methodRes = await pool.query(
    `
    SELECT sm.*, sp.name as provider_name
    FROM shipping_methods sm
    LEFT JOIN shipping_providers sp 
      ON sp.id = sm.provider_id
    WHERE sm.id = $1
    `,
    [methodId],
  );

  const method = methodRes.rows[0];

  if (!method) {
    return <p className="p-6 text-red-500">Method not found</p>;
  }

  return (
    <div className="page-wrapper">
      <div className="content space-y-6">
        <div>
          <div className="text-sm text-gray-500">
            Shipping Methods / {method.name} / Rates
          </div>

          <h2 className="text-xl font-semibold">Rates: {method.name}</h2>
          <p className="text-gray-500 text-sm">
            Provider: {method.provider_name}
          </p>
        </div>

        <RatesManager methodId={methodId} />
      </div>
    </div>
  );
}
