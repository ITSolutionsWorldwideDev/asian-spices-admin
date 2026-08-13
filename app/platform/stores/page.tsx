// app/platform/stores/page.tsx

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

  const rawPage =
    typeof params.page === "string" ? parseInt(params.page, 10) : 1;
  const page = isNaN(rawPage) || rawPage < 1 ? 1 : rawPage;

  const q = typeof params.q === "string" ? params.q : undefined;
  const status = typeof params.status === "string" ? params.status : undefined;

  // const page = Number(params.page ?? 1);
  // const q = params.q as string | undefined;
  // const status = params.status as string | undefined;
  const offset = (page - 1) * PAGE_SIZE;

  const where: string[] = [];
  const values: any[] = [];

  if (q) {
    values.push(`%${q}%`);
    where.push(`
      (
        s.name ILIKE $${values.length}
        OR s.slug ILIKE $${values.length}
        OR pr.application_id ILIKE $${values.length}
      )
    `);
  }

  if (status) {
    values.push(status);
    where.push(`s.status = $${values.length}`);
  }

  const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

  values.push(PAGE_SIZE, offset);
  const limitParamIndex = values.length - 1;
  const offsetParamIndex = values.length;

  const query = `
      SELECT s.id, s.name, s.slug, s.status, s.partner_registration_id, s.created_at,
            pr.application_id,
            COUNT(*) OVER() AS total
      FROM stores s
      LEFT JOIN partner_registration pr ON pr.partner_id::text = s.partner_registration_id
      ${whereClause}
      ORDER BY s.created_at DESC
      LIMIT $${limitParamIndex} OFFSET $${offsetParamIndex}
      `;
  // LIMIT ${PAGE_SIZE} OFFSET ${offset}

  const { rows } = await pool.query(query, values);

  // const total = rows[0]?.total ?? 0;
  const total = rows[0]?.total ? parseInt(rows[0].total, 10) : 0;

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
