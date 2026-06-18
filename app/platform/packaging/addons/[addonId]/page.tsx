// app/platform/packaging/addons/[addonId]/page.tsx

import { pool } from "@/core/db";
import { requirePlatformAdmin } from "@/lib/auth/guards";
import AddonForm from "../new/AddonForm";

export default async function EditAddonPage({
  params,
}: {
  params: Promise<{ addonId: string }>;
}) {
  await requirePlatformAdmin();

  const { addonId } = await params;

  const { rows } = await pool.query(
    `SELECT * FROM packaging_addons WHERE id = $1`,
    [addonId]
  );

  const addon = rows[0];

  if (!addon) {
    return (
      <div className="page-wrapper2 p-6">
        <div className="content max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700">
            <h4 className="font-bold">Addon Element Missing</h4>
            <p className="text-sm mt-1">The addon tracking reference link has either expired or been removed.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper2 p-6">
      <div className="content max-w-4xl mx-auto">
        <AddonForm addon={addon} />
      </div>
    </div>
  );
}