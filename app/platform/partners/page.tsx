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
        company_name ILIKE $${values.length}
        OR business_email_address ILIKE $${values.length}
        OR application_id ILIKE $${values.length}
      )
    `);
  }

  if (status) {
    values.push(status);
    where.push(`status = $${values.length}`);
  }

  const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

  values.push(PAGE_SIZE, offset);
  const limitParamIndex = values.length - 1;
  const offsetParamIndex = values.length;

  const { rows } = await pool.query(
    `
    SELECT 
      partner_id,
      application_id,
      company_name,
      business_email_address,
      status,
      created_at,
      COUNT(*) OVER() AS total
    FROM partner_registration
    ${whereClause}
    ORDER BY created_at DESC
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
