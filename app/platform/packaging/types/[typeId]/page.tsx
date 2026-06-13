// apps/admin/app/platform/packaging/types/[typeId]/page.tsx

import { pool } from "@/core/db";
import { notFound } from "next/navigation";

import { requirePlatformAdmin } from "@/lib/auth/guards";
import PackagingTypeForm from "../new/PackagingTypeForm";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function EditPackagingTypePage({
  params,
}: {
  params: Promise<{
    typeId: string;
  }>;
}) {
  await requirePlatformAdmin();

  const { typeId } =
    await params;

  if (!UUID_REGEX.test(typeId)) {
    return notFound(); 
  }

  const { rows } = await pool.query(
    `
    SELECT *
    FROM packaging_types
    WHERE id = $1
  `,
    [typeId],
  );

  const packagingType = rows[0];
  if (!packagingType) {
    return notFound();
  }

  // if (!rows.length) {
  //   return (
  //     <p className="p-6 text-red-500">
  //       Packaging type not found
  //     </p>
  //   );
  // }

  return (
    <div className="page-wrapper">
      <div className="content">
        <PackagingTypeForm
          packagingType={rows[0]}
        />
      </div>
    </div>
  );
}