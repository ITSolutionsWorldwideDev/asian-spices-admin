// apps/admin/app/platform/packaging/ribbons/[ribbonId]/page.tsx

import { pool } from "@/core/db";
import { requirePlatformAdmin } from "@/lib/auth/guards";

import RibbonForm from "../new/RibbonForm";

export default async function EditRibbonPage({
  params,
}: {
  params: Promise<{
    ribbonId: string;
  }>;
}) {
  await requirePlatformAdmin();

  const { ribbonId } = await params;

  const { rows } = await pool.query(
    `
    SELECT *
    FROM packaging_ribbons
    WHERE id = $1
  `,
    [ribbonId],
  );

  const ribbon = rows[0];

  if (!ribbon) {
    return (
      <div className="page-wrapper">
        <div className="content">
          <div className="card p-6">
            <p className="text-red-500">
              Ribbon not found
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="content">
        <RibbonForm ribbon={ribbon} />
      </div>
    </div>
  );
}