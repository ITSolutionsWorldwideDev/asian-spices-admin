// app/store/[tenant]/packaging/adjustments/page.tsx

import { pool } from "@/core/db";
import { notFound } from "next/navigation";
import AdjustmentsClient from "@/components/packaging/AdjustmentsClient";

export default async function StoreAdjustmentsPage({
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

  // Packaging catalog types array drop down data fetch sequence
  const { rows: dynamicTypes } = await pool.query(
    `
    SELECT pt.id, pt.name, pt.sku 
    FROM packaging_types pt
    JOIN store_packaging_inventory spi ON spi.packaging_type_id = pt.id
    WHERE spi.store_id = $1
    `,
    [store.id],
  );

  // Load audit logs history view sequence list
  const { rows: historyLogs } = await pool.query(
    `
    SELECT 
      l.id, l.type, l.quantity_changed, l.reason, l.created_at,
      pt.name as packaging_name, pt.sku
    FROM packaging_inventory_logs l
    JOIN packaging_types pt ON pt.id = l.packaging_type_id
    WHERE l.store_id = $1
    ORDER BY l.created_at DESC
    LIMIT 30
    `,
    [store.id],
  );

  return (
    <div className="page-wrapper2 p-6">
      <div className="content max-w-7xl mx-auto">
        <div className="p-6 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <AdjustmentsClient
              storeId={store.id}
              availableTypes={dynamicTypes}
            />
          </div>
          <div className="lg:col-span-2">
            <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-6 space-y-4">
              <h3 className="text-base font-bold text-gray-900">
                Recent On-Site Adjustments Log
              </h3>

              {!historyLogs.length ? (
                <p className="text-gray-400 text-sm italic">
                  No reconciliation entries recorded for this shift window.
                </p>
              ) : (
                <div className="divide-y divide-gray-100 overflow-hidden">
                  {historyLogs.map((log: any) => (
                    <div
                      key={log.id}
                      className="py-3 flex justify-between items-start text-sm"
                    >
                      <div>
                        <div className="font-semibold text-gray-800">
                          {log.packaging_name}
                        </div>
                        <div className="text-xs text-gray-400 font-mono mt-0.5">
                          {log.sku} • {log.reason}
                        </div>
                      </div>
                      <div className="text-right">
                        <span
                          className={`inline-block px-2 py-0.5 text-xs font-bold rounded ${
                            log.type === "damaged"
                              ? "bg-rose-50 text-rose-600"
                              : "bg-blue-50 text-blue-600"
                          }`}
                        >
                          {log.type === "damaged"
                            ? "Damaged Field"
                            : "Adjustment Manual"}{" "}
                          ({log.quantity_changed})
                        </span>
                        <div className="text-[10px] text-gray-400 font-mono mt-1">
                          {new Date(log.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
