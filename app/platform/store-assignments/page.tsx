// app/platform/store-assignments/page.tsx

import { Suspense } from "react";
import StoreAssignmentsListComponent from "@/components/products/storeAssignmentsList";
import { requireStorePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";

export default async function StoreAssignmentsPage() {
  // await requireStorePermission(PERMISSIONS.MANAGE_PRODUCTS);

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-24 space-x-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black" />
          <p className="text-gray-500 font-medium">
            Loading Products Platform...
          </p>
        </div>
      }
    >
      <StoreAssignmentsListComponent />
    </Suspense>
  );
}
