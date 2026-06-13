// apps/admin/app/platform/packaging/types/new/page.tsx

import { requirePlatformAdmin } from "@/lib/auth/guards";
import PackagingTypeForm from "./PackagingTypeForm";

export default async function NewPackagingTypePage() {
  await requirePlatformAdmin();

  return (
    <div className="page-wrapper">
      <div className="content">
        <PackagingTypeForm />
      </div>
    </div>
  );
}