// components/shipping/providers/ProvidersClient.tsx
"use client";

import Link from "next/link";
import { useOptimistic, useState } from "react";
import ProviderCard from "./ProviderCard";

export default function ProvidersClient({
  providers,
  total,
  page,
  pageSize,
}: any) {
  const totalPages = Math.ceil(total / pageSize);
  const [loading] = useState(false);

  const [optimisticProviders, updateOptimistic] = useOptimistic(
    providers,
    (state, action: any) => {
      if (action.type === "delete") {
        return state.filter((p: any) => p.id !== action.id);
      }
      if (action.type === "status") {
        return state.map((p: any) =>
          p.id === action.id ? { ...p, is_active: action.status } : p,
        );
      }
      return state;
    },
  );

  return (
    <>
      {/* HEADER */}
      <div className="page-header flex justify-between items-center mb-4">
        <div>
          <h4 className="text-lg font-semibold">Shipping Providers</h4>
          <h6 className="text-gray-500">Manage global shipping integrations</h6>
        </div>

        <Link
          href="/platform/shipping/providers/new"
          className="btn btn-primary"
        >
          Add Provider
        </Link>
      </div>

      {/* EMPTY / LOADING */}
      {loading ? (
        <div className="card">
          <div className="card-body p-3 text-center py-6">
            <div className="flex items-center justify-center py-24 space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black" />
              <p className="text-gray-500 font-medium">Loading...</p>
            </div>
          </div>
        </div>
      ) : optimisticProviders.length === 0 ? (
        <div className="card">
          <div className="card-body p-3 text-center py-10 text-gray-500">
            No providers found
          </div>
        </div>
      ) : (
        <>
          {/* GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {optimisticProviders.map((provider: any) => (
              <ProviderCard
                key={provider.id}
                provider={provider}
                onToggleStatus={() => {
                  const status = !provider.is_active;
                  updateOptimistic({
                    type: "status",
                    id: provider.id,
                    status,
                  });
                  // TODO: call API
                }}
                onDelete={() => {
                  updateOptimistic({
                    type: "delete",
                    id: provider.id,
                  });
                  // TODO: call API
                }}
              />
            ))}
          </div>

          {/* PAGINATION */}
          <div className="flex justify-center gap-2 mt-6">
            {Array.from({ length: totalPages }).map((_, i) => (
              <Link
                key={i}
                href={`?page=${i + 1}`}
                className={`px-3 py-1 rounded ${
                  page === i + 1 ? "bg-blue-600 text-white" : "bg-gray-200"
                }`}
              >
                {i + 1}
              </Link>
            ))}
          </div>
        </>
      )}
    </>
  );
}
