//  /app/platform/packaging/inventory/page.tsx

import { pool } from "@/core/db";

import { requirePlatformAdmin } from "@/lib/auth/guards";
import InventoryClient from "@/components/platform/packaging/inventory/InventoryClient";

const PAGE_SIZE = 20;

export default async function PackagingInventoryPage({
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
    where.push(`
      (
        s.name ILIKE $${values.length}
        OR pt.name ILIKE $${values.length}
        OR pt.sku ILIKE $${values.length}
      )
    `);
  }
  
  const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const { rows } = await pool.query(
    `
    SELECT
      spi.id,
      s.id as store_id,
      s.name as store_name,
      pt.id as packaging_type_id,
      pt.name as packaging_name,
      pt.sku as packaging_code,
      spi.quantity_available as quantity,
      spi.reserved_quantity,
      spi.minimum_threshold,
      spi.damaged_quantity,
      spi.updated_at,
      COUNT(*) OVER() AS total
    FROM store_packaging_inventory spi
    JOIN stores s ON s.id = spi.store_id
    JOIN packaging_types pt ON pt.id = spi.packaging_type_id
    ${whereClause}
    ORDER BY spi.updated_at DESC
    LIMIT ${PAGE_SIZE} OFFSET ${offset}
    `,
    values,
  );

  const total = rows[0]?.total ?? 0;

  return (
    <div className="page-wrapper">
      <div className="content">
        <InventoryClient
          inventory={rows}
          total={total}
          page={page}
          pageSize={PAGE_SIZE}
          search={q || ""}
        />
      </div>
    </div>
  );
}
