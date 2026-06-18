//  /app/platform/packaging/types/page.tsx

import { pool } from "@/core/db";

import { requirePlatformAdmin } from "@/lib/auth/guards";
import PackagingTypesClient from "@/components/platform/packaging/types/PackagingTypesClient";

const PAGE_SIZE = 12;

export default async function PackagingTypesPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] }>;
}) {
  await requirePlatformAdmin();

  const params = searchParams
    ? await searchParams
    : {};

  const page = Math.max(
    1,
    Number(params.page) || 1,
  );

  const q = params.q as
    | string
    | undefined;

  const offset =
    (page - 1) * PAGE_SIZE;

  const where: string[] = [];

  const values: any[] = [];

  if (q) {
    values.push(`%${q}%`);

    where.push(`
      (
        pt.name ILIKE $${values.length}
        OR pt.code ILIKE $${values.length}
      )
    `);
  }

  const whereClause =
    where.length
      ? `WHERE ${where.join(
          " AND ",
        )}`
      : "";

  const { rows } = await pool.query(
    `
    SELECT
      pt.*,
      COUNT(*) OVER() AS total

    FROM packaging_types pt

    ${whereClause}

    ORDER BY pt.created_at DESC

    LIMIT ${PAGE_SIZE}
    OFFSET ${offset}
  `,
    values,
  );

  const total =
    rows[0]?.total ?? 0;

  return (
    <div className="page-wrapper">
      <div className="content">
        <PackagingTypesClient
          packagingTypes={rows}
          total={total}
          page={page}
          pageSize={PAGE_SIZE}
          search={q || ""}
        />
      </div>
    </div>
  );
}