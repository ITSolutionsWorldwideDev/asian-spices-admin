// apps/admin/app/platform/shipping/providers/new/page.tsx

import { requirePlatformAdmin } from "@/lib/auth/guards";
import ProviderForm from "./ProviderForm";

export default async function NewProviderPage() {
  await requirePlatformAdmin();

  return (
    <div className="page-wrapper">
      <div className="content">
        <ProviderForm />
      </div>
    </div>
  );
}