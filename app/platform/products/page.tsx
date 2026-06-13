// apps/admin/app/platform/products/page.tsx
// apps/admin/app/(store)/products/page.tsx

import ProductListComponent from "@/components/products/productlist";
import { requireStorePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";

export default async function ProductsPage() {
  // await requireStorePermission(PERMISSIONS.MANAGE_PRODUCTS);

  return (
    <>
      <ProductListComponent />
    </>
  );
}
