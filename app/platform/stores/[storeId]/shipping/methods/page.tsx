// apps/admin/app/platform/stores/[storeId]/shipping/methods/page.tsx

import { pool } from "@/core/db";
import { requirePlatformAdmin } from "@/lib/auth/guards";
import StoreMethodAssignCard from "@/components/platform/shipping/StoreMethodAssignCard";

interface StoreShippingMethodAssignment {
  id: string | number;
  store_id: string | number;
  method_id: string;
  is_active?: boolean;
  // Add any extra operational field parameters your database uses here
}

export default async function StoreShippingMethodsPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  await requirePlatformAdmin();

  const { storeId } = await params;

  // All methods
  const methodsRes = await pool.query(`
    SELECT sm.*, sp.name as provider_name
    FROM shipping_methods sm
    LEFT JOIN shipping_providers sp 
      ON sp.id = sm.provider_id
    WHERE sm.is_active = true
    ORDER BY sm.created_at DESC
  `);

  // Existing assignments
  const assignRes = await pool.query<StoreShippingMethodAssignment>(
    `
    SELECT *
    FROM store_shipping_methods
    WHERE store_id = $1
    `,
    [storeId]
  );

  const assignments = assignRes.rows;

  const getAssignment = (methodId: string) =>
    assignments.find((a) => a.method_id === methodId);

  return (
    
    <div className=" mx-auto">
      <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-xl font-semibold">
            Store Shipping Methods
          </h2>
          <p className="text-gray-500 text-sm">
            Enable shipping options for this store
          </p>
        </div>

        {/* Methods */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {methodsRes.rows.map((method: any) => (
            <StoreMethodAssignCard
              key={method.id}
              storeId={storeId}
              method={method}
              assignment={getAssignment(method.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}