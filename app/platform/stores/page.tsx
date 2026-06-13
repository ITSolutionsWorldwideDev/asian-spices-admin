// apps/admin/app/platform/stores/page.tsx

import { pool } from "@/core/db";
import { requirePlatformAdmin } from "@/lib/auth/guards";
import StoresClient from "@/components/platform/stores/StoresClient";

const PAGE_SIZE = 9;

export default async function StoresPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] }>;
}) {
  await requirePlatformAdmin();

  const params = searchParams ? await searchParams : {};

  const page = Number(params.page ?? 1);
  const q = params.q as string | undefined;
  const status = params.status as string | undefined;
  const offset = (page - 1) * PAGE_SIZE;

  const where: string[] = [];
  const values: any[] = [];

  if (q) {
    values.push(`%${q}%`);
    where.push(`(name ILIKE $${values.length} OR slug ILIKE $${values.length})`);
  }

  if (status) {
    values.push(status);
    where.push(`status = $${values.length}`);
  }

  const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const { rows } = await pool.query(
    `
    SELECT id, name, slug, status, created_at,
           COUNT(*) OVER() AS total
    FROM stores
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT ${PAGE_SIZE} OFFSET ${offset}
    `,
    values,
  );

  /* 
  
	SELECT
    s.id,
    s.name,
    s.slug,
    s.status,
    s.created_at,
	pr.application_id,
    COUNT(*) OVER() AS total
FROM stores s
LEFT JOIN partner_registration pr
    ON pr.partner_id = s.partner_registration_id::uuid;
  */

  const total = rows[0]?.total ?? 0;

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          <StoresClient
            stores={rows}
            total={total}
            page={page}
            pageSize={PAGE_SIZE}
            search={q || ""}
            statusFilter={status || ""}
          />
        </div>
      </div>
    </>
  );
}
