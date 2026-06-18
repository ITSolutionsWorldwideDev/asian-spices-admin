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
    SELECT *
    FROM partner_registration
    WHERE partner_id = $1
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
