// apps/admin/app/store/[tenant]/packaging/stock/page.tsx

import { pool } from "@/core/db";
import { notFound } from "next/navigation";
import StockClient from "@/components/packaging/StockClient";

export default async function StoreStockPage({
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

  // Load physical stock numbers local to this node
  const { rows: stock } = await pool.query(
    `
    SELECT 
      spi.id,
      spi.quantity_available as quantity,
      spi.reserved_quantity,
      spi.minimum_threshold,
      spi.damaged_quantity,
      pt.id as packaging_type_id,
      pt.name,
      pt.sku,
      pt.package_type
    FROM store_packaging_inventory spi
    JOIN packaging_types pt ON pt.id = spi.packaging_type_id
    WHERE spi.store_id = $1
    ORDER BY pt.name ASC
    `,
    [store.id],
  );

  const { rows: availableTemplates } = await pool.query(
    "SELECT id, name, sku FROM packaging_types WHERE is_active = true ORDER BY name ASC",
  );

  return (
    <div className="page-wrapper2 p-6">
      <div className="content max-w-7xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Local Packaging Stock
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Managing live material availability metrics for{" "}
            <span className="font-semibold text-gray-700">{store.name}</span>
          </p>
        </div>

        {/* <StockClient stock={stock} storeId={store.id} /> */}
        <StockClient
          stock={stock}
          availableTemplates={availableTemplates}
          storeId={store.id}
        />
      </div>
    </div>
  );
}
