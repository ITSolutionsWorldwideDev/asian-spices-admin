// app/platform/packaging/packages/page.tsx

import { pool } from "@/core/db";
import { requirePlatformAdmin } from "@/lib/auth/guards";
import PackagingClient from "@/components/platform/packaging/PackagingClient";

const PAGE_SIZE = 12;

export default async function PackagingPage({
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
        pp.name ILIKE $${values.length}
        OR pp.code ILIKE $${values.length}
      )
    `);
  }

  const whereClause = where.length
    ? `WHERE ${where.join(" AND ")}`
    : "";

  const { rows } = await pool.query(
    `
    SELECT
      pp.*,
      COUNT(*) OVER() AS total

    FROM packaging_packages pp

    ${whereClause}

    ORDER BY pp.created_at DESC

    LIMIT ${PAGE_SIZE}
    OFFSET ${offset}
  `,
    values,
  );

  const total = rows[0]?.total ?? 0;

  return (
    <div className="page-wrapper">
      <div className="content">
        <PackagingClient
          packages={rows}
          total={total}
          page={page}
          pageSize={PAGE_SIZE}
          search={q || ""}
        />
      </div>
    </div>
  );
}