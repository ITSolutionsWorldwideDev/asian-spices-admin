// app/platform/packaging/rules/page.tsx

import { pool } from "@/core/db";
import { requirePlatformAdmin } from "@/lib/auth/guards";
import RulesClient from "@/components/platform/packaging/rules/RulesClient";

export default async function PackagingRulesPage() {
  await requirePlatformAdmin();

  // 1. Get active packaging rules setup
  const rulesPromise = pool.query(`
    SELECT
      pr.id,
      pr.name,
      pr.packaging_type_id,
      pr.min_weight_kg,
      pr.max_weight_kg,
      pr.min_order_amount,
      pr.max_order_amount,
      pr.priority,
      pr.is_active,
      pt.name as packaging_name,
      pt.package_type
    FROM packaging_rules pr
    LEFT JOIN packaging_types pt ON pt.id = pr.packaging_type_id
    ORDER BY pr.priority ASC, pr.created_at DESC
  `);

  // 2. Fetch packaging types for form selections
  const typesPromise = pool.query(`
    SELECT id, name, sku, package_type 
    FROM packaging_types 
    WHERE is_active = true 
    ORDER BY name ASC
  `);

  const [rulesResult, typesResult] = await Promise.all([rulesPromise, typesPromise]);

  return (
    <div className="page-wrapper2 p-6">
      <div className="content max-w-7xl mx-auto">
        <RulesClient 
          rules={rulesResult.rows} 
          packagingTypes={typesResult.rows} 
        />
      </div>
    </div>
  );
}