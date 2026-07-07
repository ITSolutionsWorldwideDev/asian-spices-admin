// app/platform/products/promos/page.tsx
import PromoCodeListComponent from "@/components/products/PromoCodeListComponent";
import { requireStorePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";

export default async function PromosPage() {
  // await requireStorePermission(PERMISSIONS.MANAGE_PROMOTIONS);

  return (
    <>
      <PromoCodeListComponent />
    </>
  );
}
