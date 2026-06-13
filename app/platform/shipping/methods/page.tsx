// apps/admin/app/platform/shipping/methods/page.tsx

import { pool } from "@/core/db";
import { requirePlatformAdmin } from "@/lib/auth/guards";
import ShippingMethodsClient from "@/components/platform/shipping/ShippingMethodsClient";

const PAGE_SIZE = 10;

export default async function ShippingMethodsPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] }>;
}) {
  await requirePlatformAdmin();

  const params = searchParams ? await searchParams : {};

  const page = Math.max(1, Number(params.page) || 1);
  const q = params.q as string | undefined;
  const offset = (page - 1) * PAGE_SIZE;

  const where: string[] = [];
  const values: any[] = [];

  if (q) {
    values.push(`%${q}%`);
    where.push(
      `(sm.name ILIKE $${values.length} OR sm.code ILIKE $${values.length})`,
    );
  }

  const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const { rows } = await pool.query(
    `
    SELECT 
      sm.*,
      sp.name as provider_name,
      COUNT(*) OVER() AS total
    FROM shipping_methods sm
    LEFT JOIN shipping_providers sp 
      ON sp.id = sm.provider_id
    ${whereClause}
    ORDER BY sm.created_at DESC
    LIMIT ${PAGE_SIZE} OFFSET ${offset}
    `,
    values,
  );

  const providersRes = await pool.query(`
    SELECT id, name FROM shipping_providers WHERE is_active = true
  `);

  const total = rows[0]?.total ?? 0;

  return (
    <div className="page-wrapper">
      <div className="content space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-xl font-semibold">Shipping Methods</h2>
          <p className="text-gray-500 text-sm">
            Manage delivery methods (Standard, Express, etc.)
          </p>
        </div>

        {/* List */}
        
        <ShippingMethodsClient
          methods={rows}
          providers={providersRes.rows}
          total={total}
          page={page}
          pageSize={PAGE_SIZE}
          search={q}
        />
      </div>
    </div>
  );
}
