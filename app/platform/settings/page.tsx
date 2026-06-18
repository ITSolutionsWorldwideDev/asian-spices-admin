// app/(platform)/settings/page.tsx

import { pool } from "@/core/db";
import { requirePlatformAdmin } from "@/lib/auth/guards";
import GeneralSettingsForm from "@/components/platform/settings/GeneralSettingsForm";
import BillingSettingsForm from "@/components/platform/settings/BillingSettingsForm";
import FeatureFlagsForm from "@/components/platform/settings/FeatureFlagsForm";

interface PlatformSettingRow {
  key: string;
  value: any;
}

export default async function PlatformSettingsPage() {
  await requirePlatformAdmin();

  const { rows } = await pool.query<PlatformSettingRow>(`SELECT key, value FROM platform_settings`);

  const settings = Object.fromEntries(rows.map((r) => [r.key, r.value]));

  return (
    <div className="page-wrapper">
      <div className="content space-y-10">
        <div className="bg-white p-6 rounded shadow space-y-4">
          <h1 className="text-2xl font-bold">Platform Settings</h1>

          <GeneralSettingsForm initialValues={settings.general ?? {}} />

          <BillingSettingsForm initialValues={settings.billing ?? {}} />

          <FeatureFlagsForm initialValues={settings.features ?? {}} />
        </div>
      </div>
    </div>
  );
}
