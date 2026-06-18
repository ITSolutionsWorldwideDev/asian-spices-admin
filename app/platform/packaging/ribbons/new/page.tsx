// app/platform/packaging/ribbons/new/page.tsx

import { requirePlatformAdmin } from "@/lib/auth/guards";
import RibbonForm from "./RibbonForm";

export default async function NewRibbonPage() {
  await requirePlatformAdmin();

  return (
    <div className="page-wrapper">
      <div className="content">
        <RibbonForm />
      </div>
    </div>
  );
}