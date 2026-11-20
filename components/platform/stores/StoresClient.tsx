// components/platform/stores/StoresClient.tsx

"use client";

import Link from "next/link";
import { startTransition, useOptimistic, useState } from "react";
import FiltersBar from "./FiltersBar";
import StoreCard from "./StoreCard";
import { deleteStore, setStoreStatus } from "./actions";
import LoaderOverlay from "@/components/layout/loader-overlay";

export default function StoresClient({ stores, total, page, pageSize }: any) {
  const totalPages = Math.ceil(total / pageSize);
  const [deleting, setDeleting] = useState(false);

  const [optimisticStores, updateOptimistic] = useOptimistic(
    stores,
    (state, action: any) => {
      if (action.type === "delete") {
        return state.filter((s: any) => s.id !== action.id);
      }
      if (action.type === "status") {
        return state.map((s: any) =>
          s.id === action.id ? { ...s, status: action.status } : s,
        );
      }
      return state;
    },
  );

  return (
    <>
      <LoaderOverlay show={deleting} message="Deleting store..." />

      <div className="page-header flex justify-between items-center mb-4">
        <div>
          <h4 className="text-lg font-semibold">Stores</h4>
          <h6 className="text-gray-500">Manage platform stores</h6>
        </div>

        <Link href="/platform/stores/new" className="btn btn-primary">
          Add Store
        </Link>
      </div>

      <div className="card">
        <div className="card-header flex justify-between items-center">
          <FiltersBar />
        </div>
        <div className="card-body p-3"></div>
      </div>

      {optimisticStores.length === 0 ? (
        <div className="card">
          <div className="card-body p-3">
            <p className="text-center py-10 text-gray-500">No Store found</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {optimisticStores.map((store: any) => (
            <StoreCard
              key={store.id}
              store={store}
              onDelete={async () => {
                if (deleting) return;
                const ok = window.confirm(
                  `Are you sure you want to delete the store "${store.name}"? This cannot be undone.`,
                );
                if (!ok) return;
                setDeleting(true);
                startTransition(() => {
                  updateOptimistic({ type: "delete", id: store.id });
                });
                try {
                  await deleteStore(store.id);
                } catch (error) {
                  console.error("Failed to delete store:", error);
                  alert("Failed to delete store. Please try again.");
                } finally {
                  setDeleting(false);
                }
              }}
              onToggleStatus={async () => {
                const status =
                  store.status === "active" ? "suspended" : "active";
                startTransition(() => {
                  updateOptimistic({ type: "status", id: store.id, status });
                });
                await setStoreStatus(store.id, status);
              }}
            />
          ))}
        </div>
      )}

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
  );
}
