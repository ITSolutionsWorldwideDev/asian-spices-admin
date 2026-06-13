// apps/admin/app/platform/shipping/providers/[providerId]/page.tsx

import { pool } from "@/core/db";
import ProviderForm from "../new/ProviderForm";
import { requirePlatformAdmin } from "@/lib/auth/guards";
import { getProviderCredentials } from "@/lib/shipping/providerService";

export default async function EditProviderPage({
  params,
}: {
  params: Promise<{ providerId: string }>;
}) {
  await requirePlatformAdmin();

  const { providerId } = await params;

  const { rows } = await pool.query(
    `SELECT slug FROM shipping_providers WHERE id = $1`,
    // `SELECT slug FROM shipping_provider_configs WHEREprovider_id = $1`,
    [providerId]
  );

  if (!rows.length) {
    return <p>Provider not found</p>;
  }

  const slug = rows[0].slug;

  // ✅ Use service (includes decrypted credentials)
  const provider = await getProviderCredentials(slug);

  console.log('provider ==== ',provider);

  return (
    <div className="page-wrapper">
      <div className="content">
        <ProviderForm provider={provider} />
      </div>
    </div>
  );
}