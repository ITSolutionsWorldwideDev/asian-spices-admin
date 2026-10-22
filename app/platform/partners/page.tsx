// app/platform/partners/page.tsx

import { pool } from "@/core/db";
import { requirePlatformAdmin } from "@/lib/auth/guards";
import PartnersClient from "@/components/platform/partners/PartnersClient";

const PAGE_SIZE = 9;

export default async function PartnersPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await requirePlatformAdmin();

  const params = searchParams ? await searchParams : {};

  const rawPage =
    typeof params.page === "string" ? parseInt(params.page, 10) : 1;
  const page = isNaN(rawPage) || rawPage < 1 ? 1 : rawPage;

  const q = typeof params.q === "string" ? params.q : undefined;
  const status = typeof params.status === "string" ? params.status : undefined;

  const offset = (page - 1) * PAGE_SIZE;

  const where: string[] = [];
  const values: any[] = [];

  if (q) {
    values.push(`%${q}%`);
    where.push(`
      (
        pr.company_name ILIKE $${values.length}
        OR pr.business_email_address ILIKE $${values.length}
        OR pr.application_id ILIKE $${values.length}
        OR st.store_name ILIKE $${values.length}
      )
    `);
  }

  if (status) {
    values.push(status);
    where.push(`pr.status = $${values.length}`);
  }

  const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

  values.push(PAGE_SIZE, offset);
  const limitParamIndex = values.length - 1;
  const offsetParamIndex = values.length;

  const { rows } = await pool.query(
    `
    SELECT 
      pr.partner_id,
      pr.application_id,
      pr.company_name,
      pr.business_email_address,
      pr.status,
      pr.created_at,
      st.store_name,
      COUNT(*) OVER() AS total
    FROM partner_registration pr
    LEFT JOIN LATERAL (
      SELECT STRING_AGG(s.name, ', ' ORDER BY s.created_at ASC) AS store_name
      FROM stores s
      WHERE s.partner_registration_id = pr.partner_id::text
         OR (pr.application_id IS NOT NULL AND s.partner_registration_id = pr.application_id)
    ) st ON true
    ${whereClause}
    ORDER BY pr.created_at DESC
    LIMIT $${limitParamIndex} OFFSET $${offsetParamIndex}
    `,
    values,
  );

  const total = rows[0]?.total ? parseInt(rows[0].total, 10) : 0;

  return (
    <div className="page-wrapper">
      <div className="content">
        <PartnersClient
          partners={rows}
          total={total}
          page={page}
          pageSize={PAGE_SIZE}
          search={q || ""}
          statusFilter={status || ""}
        />
      </div>
    </div>
  );
}
