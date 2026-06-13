// apps/admin/app/platform/packaging/orders/page.tsx

import { pool } from "@/core/db";
import { requirePlatformAdmin } from "@/lib/auth/guards";
import PackagingOrdersClient from "@/components/platform/packaging/orders/PackagingOrdersClient";

const PAGE_SIZE = 20;

export default async function PackagingOrdersPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] }>;
}) {
  await requirePlatformAdmin();

  const params = searchParams ? await searchParams : {};
  const page = Math.max(1, Number(params.page) || 1);
  const q = params.q as string | undefined;
  const statusFilter = params.status as string | undefined;
  const offset = (page - 1) * PAGE_SIZE;

  const where: string[] = [];
  const values: any[] = [];

  if (q?.trim()) {
    values.push(`%${q.trim()}%`);
    where.push(
      `(so.order_number ILIKE $${values.length} OR s.name ILIKE $${values.length} OR pt.name ILIKE $${values.length})`,
    );
  }

  if (statusFilter?.trim()) {
    values.push(statusFilter.trim());
    where.push(`op.packaging_status = $${values.length}`);
  }

  const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const { rows } = await pool.query(
    `
    SELECT
      op.id,
      so.id as order_id,
      so.order_number,
      s.name as store_name,
      pt.name as packaging_name,
      pr.name as ribbon_name,
      op.packaging_status as status,
      op.packaging_cost,
      op.created_at,
      COUNT(*) OVER() AS total
    FROM order_packaging op
    JOIN store_orders so ON so.id = op.order_id
    LEFT JOIN stores s ON s.id = so.current_store_id
    LEFT JOIN packaging_types pt ON pt.id = op.packaging_type_id
    LEFT JOIN packaging_ribbons pr ON pr.id = op.ribbon_id
    ${whereClause}
    ORDER BY op.created_at DESC
    LIMIT ${PAGE_SIZE} OFFSET ${offset}
    `,
    values,
  );

  const total = rows[0]?.total ?? 0;

  return (
    <div className="page-wrapper2 p-6">
      <div className="content max-w-7xl mx-auto">
        <PackagingOrdersClient
          orders={rows}
          total={total}
          page={page}
          pageSize={PAGE_SIZE}
          search={q || ""}
          statusFilter={statusFilter || ""}
        />
      </div>
    </div>
  );
}
