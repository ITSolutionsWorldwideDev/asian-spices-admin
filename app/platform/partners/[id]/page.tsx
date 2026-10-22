// app/platform/partners/[id]/page.tsx

import { pool } from "@/core/db";
import { requirePlatformAdmin } from "@/lib/auth/guards";
import PartnerDetail from "@/components/platform/partners/PartnerDetail";

import { notFound } from "next/navigation";

function isUUID(id: string) {
  return /^[0-9a-fA-F-]{36}$/.test(id);
}

export default async function PartnerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePlatformAdmin();

  const { id } = await params;

  if (!id || !isUUID(id)) {
    return notFound();
  }

  const { rows } = await pool.query(
    `
    SELECT pr.*,
           st.store_name
    FROM partner_registration pr
    LEFT JOIN LATERAL (
      SELECT STRING_AGG(s.name, ', ' ORDER BY s.created_at ASC) AS store_name
      FROM stores s
      WHERE s.partner_registration_id = pr.partner_id::text
         OR (pr.application_id IS NOT NULL AND s.partner_registration_id = pr.application_id)
    ) st ON true
    WHERE pr.partner_id = $1
    `,
    [id],
  );

  const partner = rows[0];

  console.log('partner === ',partner);

  if (!partner) {
    return <p>Partner not found</p>;
  }

  return (
    <div className="page-wrapper">
      <div className="content space-y-6">
        <PartnerDetail partner={partner} />
      </div>
    </div>
  );
}
