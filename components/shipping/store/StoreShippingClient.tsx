// apps/admin/components/shipping/store/StoreShippingClient.tsx
"use client";

import { useState } from "react";
import ProviderAssignCard from "./ProviderAssignCard";

export default function StoreShippingClient({
  storeId,
  providers,
  assignments,
}: any) {
  const [data, setData] = useState(assignments);

  const getAssignment = (providerId: string) =>
    data.find((a: any) => a.provider_id === providerId);

  return (
    <>
      <div className="page-header mb-6">
        <h4 className="text-lg font-semibold">Shipping Providers</h4>
        <p className="text-gray-500 text-sm">
          Enable and configure shipping providers for this store
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {providers.map((provider: any) => (
          <ProviderAssignCard
            key={provider.id}
            storeId={storeId}
            provider={provider}
            assignment={getAssignment(provider.id)}
            onUpdate={(updated: any) => {
              setData((prev: any) => {
                const exists = prev.find(
                  (p: any) => p.provider_id === updated.provider_id,
                );

                if (exists) {
                  return prev.map((p: any) =>
                    p.provider_id === updated.provider_id ? updated : p,
                  );
                }

                return [...prev, updated];
              });
            }}
          />
        ))}
      </div>
    </>
  );
}