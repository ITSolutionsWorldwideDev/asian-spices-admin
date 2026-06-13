// apps/admin/app/platform/packaging/addons/page.tsx

import { pool } from "@/core/db";
import { requirePlatformAdmin } from "@/lib/auth/guards";
import AddonsClient from "@/components/platform/packaging/addons/AddonsClient";

const PAGE_SIZE = 10;

export default async function PackagingAddonsPage({
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
    where.push(`(name ILIKE $${values.length} OR sku ILIKE $${values.length})`);
  }

  const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const { rows } = await pool.query(
    `
    SELECT
      id, name, sku, addon_type, cost_price, is_active, created_at,
      COUNT(*) OVER() AS total
    FROM packaging_addons
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT ${PAGE_SIZE} OFFSET ${offset}
    `,
    values
  );

  const total = rows[0]?.total ?? 0;

  return (
    <div className="page-wrapper2 p-6">
      <div className="content max-w-7xl mx-auto">
        <AddonsClient
          addons={rows}
          total={total}
          page={page}
          pageSize={PAGE_SIZE}
          search={q || ""}
        />
      </div>
    </div>
  );
}