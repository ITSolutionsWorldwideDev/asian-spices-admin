// apps/admin/app/store/[tenant]/packaging/rules/page.tsx

import { pool } from "@/core/db";
import { notFound } from "next/navigation";
import TenantRulesClient from "@/components/packaging/TenantRulesClient";

export default async function StoreRulesPage({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const { tenant } = await params;

  // Simple regex test to determine if the incoming tenant parameter path string is a structural uuid format
  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      tenant,
    );

  // FIXED: Executing localized, strongly-typed checks to prevent PostgreSQL comparison failures
  const storeRes = isUuid
    ? await pool.query("SELECT id, name FROM stores WHERE id = $1 LIMIT 1", [
        tenant,
      ])
    : await pool.query("SELECT id, name FROM stores WHERE slug = $1 LIMIT 1", [
        tenant,
      ]);

  const store = storeRes.rows[0];
  if (!store) notFound();

  // Load rules that are either global (null) or specific to this store location
  const { rows: rules } = await pool.query(
    `
    SELECT 
      pr.id, pr.name, pr.min_weight_kg, pr.max_weight_kg,
      pr.min_order_amount, pr.max_order_amount, pr.priority, pr.store_id,
      pt.name as packaging_name
    FROM packaging_rules pr
    LEFT JOIN packaging_types pt ON pt.id = pr.packaging_type_id
    WHERE pr.store_id IS NULL OR pr.store_id = $1
    ORDER BY pr.store_id DESC NULLS LAST, pr.priority ASC
    `,
    [store.id],
  );

  const { rows: dynamicTypes } = await pool.query(
    "SELECT id, name FROM packaging_types WHERE is_active = true ORDER BY name ASC",
  );

  return (
    <div className="page-wrapper2 p-6">
      <div className="content max-w-7xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Custom Branch Packing Rules
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Add specific overrides to customize local package selections for{" "}
            <span className="font-semibold text-gray-700">{store.name}</span>.
          </p>
        </div>

        <TenantRulesClient
          rules={rules}
          packagingTypes={dynamicTypes}
          storeId={store.id}
        />
      </div>
    </div>
  );
}
