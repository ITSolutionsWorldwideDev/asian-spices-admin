// app/platform/packaging/packages/new/page.tsx

import { requirePlatformAdmin } from "@/lib/auth/guards";
import PackageForm from "./PackageForm";

export default async function NewPackagePage() {
  await requirePlatformAdmin();

  return (
    <div className="page-wrapper">
      <div className="content">
        <PackageForm />
      </div>
    </div>
  );
}