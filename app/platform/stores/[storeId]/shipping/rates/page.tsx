// apps/admin/app/platform/stores/[storeId]/shipping/rates/page.tsx
import { pool } from "@/core/db";
import { requirePlatformAdmin } from "@/lib/auth/guards";
import StoreRatesClient from "@/components/shipping/store/StoreRatesClient";

export default async function StoreShippingRatesPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  await requirePlatformAdmin();

  const { storeId } = await params;

  // -----------------------------
  // Get all shipping methods
  // -----------------------------
  const methodsRes = await pool.query(
    `
    SELECT 
      sm.id,
      sm.name,
      sm.code,
      sm.type,
      sp.name AS provider_name
    FROM shipping_methods sm
    LEFT JOIN shipping_providers sp 
      ON sp.id = sm.provider_id
    WHERE sm.is_active = true
    ORDER BY sm.created_at DESC
    `,
  );

  // -----------------------------
  // Store-specific rates
  // -----------------------------
  const ratesRes = await pool.query(
    `
    SELECT *
    FROM store_shipping_rates
    WHERE store_id = $1
    `,
    [storeId],
  );

  // -----------------------------
  // Countries (for dropdown UI)
  // -----------------------------
  const countriesRes = await pool.query(
    `
    SELECT country_code, country_name
    FROM countries
    WHERE country_status = 'active'
    ORDER BY country_name ASC
    `,
  );

  return (
    <div className=" mx-auto">
      <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm space-y-6">
        <div>
          <h2 className="text-xl font-semibold">Shipping Rates</h2>
          <p className="text-sm text-gray-500">
            Configure pricing rules per country and weight
          </p>
        </div>

        {/* Client UI */}
        <StoreRatesClient
          storeId={storeId}
          methods={methodsRes.rows}
          rates={ratesRes.rows}
          countries={countriesRes.rows}
        />
      </div>
    </div>
  );
}
