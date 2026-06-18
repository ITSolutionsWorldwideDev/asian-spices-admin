// app/platform/packaging/packages/[packageId]/page.tsx

import { pool } from "@/core/db";

import { requirePlatformAdmin } from "@/lib/auth/guards";

import PackageForm from "../new/PackageForm";

export default async function EditPackagePage({
  params,
}: {
  params: Promise<{ packageId: string }>;
}) {
  await requirePlatformAdmin();

  const { packageId } = await params;

  const { rows } = await pool.query(
    `
    SELECT *
    FROM packaging_packages
    WHERE id = $1
  `,
    [packageId],
  );

  if (!rows.length) {
    return (
      <p className="p-6">
        Package not found
      </p>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="content">
        <PackageForm
          packageData={rows[0]}
        />
      </div>
    </div>
  );
}