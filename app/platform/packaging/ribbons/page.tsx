// app/platform/packaging/ribbons/page.tsx

import { pool } from "@/core/db";
import { requirePlatformAdmin } from "@/lib/auth/guards";
import RibbonsClient from "@/components/platform/packaging/ribbons/RibbonsClient";

const PAGE_SIZE = 10;

export default async function PackagingRibbonsPage({
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
        name ILIKE $${values.length}
        OR code ILIKE $${values.length}
      )
    `);
  }

  const whereClause = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";

  const { rows } = await pool.query(
    `
    SELECT
      id,
      sku,
      name,
      color,
      material,
      width_mm,
      cost_price,
      is_active,
      created_at,
      COUNT(*) OVER() AS total

    FROM packaging_ribbons

    ${whereClause}

    ORDER BY created_at DESC

    LIMIT ${PAGE_SIZE}
    OFFSET ${offset}
  `,
    values,
  );

  const total = rows[0]?.total ?? 0;

  return (
    <div className="page-wrapper">
      <div className="content">
        <RibbonsClient
          ribbons={rows}
          total={total}
          page={page}
          pageSize={PAGE_SIZE}
          search={q || ""}
        />
      </div>
    </div>
  );
}
