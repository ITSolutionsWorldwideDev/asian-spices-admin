// apps/admin/components/packaging/StockClient.tsx

"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export interface StockItem {
  id: string;
  packaging_type_id: string;
  name: string;
  sku: string;
  package_type: string;
  quantity: number;
  reserved_quantity: number;
  minimum_threshold: number;
  damaged_quantity: number;
}

export interface GlobalTemplateOption {
  id: string;
  name: string;
  sku: string;
}

interface StockClientProps {
  stock: StockItem[];
  availableTemplates: GlobalTemplateOption[]; // Passed down to populate your allocation selector
  storeId: string;
}

export default function StockClient({
  stock,
  availableTemplates,
  storeId,
}: StockClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [assigningId, setAssigningId] = useState("");
  const [loading, setLoading] = useState(false);

  // Filter out templates that are already allocated to this store node to avoid UX duplication
  const allocatedIds = new Set(stock.map((item) => item.packaging_type_id));
  const unallocatedTemplates = availableTemplates.filter(
    (template) => !allocatedIds.has(template.id),
  );

  const handleAssignPackaging = async () => {
    if (!assigningId) return;

    setLoading(true);

    try {
      const res = await fetch("/api/store/packaging/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          store_id: storeId,
          packaging_type_id: assigningId,
          initial_quantity: 0,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setAssigningId("");
        // Safe App Router server validation cycle frame
        startTransition(() => {
          router.refresh();
        });
      } else {
        alert(data.error);
      }
    } catch {
      alert(
        "Error processing local inventory packaging initialization allocation.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 🚀 ALLOCATION MANAGEMENT INTERFACE PANEL */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex flex-col sm:flex-row items-end gap-4 justify-between">
        <div className="w-full sm:max-w-md">
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
            Allocate System Packaging Template to Store
          </label>
          <select
            value={assigningId}
            onChange={(e) => setAssigningId(e.target.value)}
            disabled={loading || isPending}
            className="w-full text-sm border border-gray-200 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden disabled:bg-gray-100"
          >
            <option value="">
              -- Choose a standard template configuration to register --
            </option>
            {unallocatedTemplates.map((box) => (
              <option key={box.id} value={box.id}>
                {box.name} ({box.sku})
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={handleAssignPackaging}
          disabled={!assigningId || loading || isPending}
          className="w-full sm:w-auto px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 rounded-lg shadow-xs transition-colors h-[42px]"
        >
          {loading || isPending ? "Allocating..." : "Initialize Variant"}
        </button>
      </div>
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
        {!stock.length ? (
          <div className="p-12 text-center text-gray-400 text-sm font-medium">
            No packaging elements allocated to this store location.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm text-gray-600">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-gray-700 font-semibold uppercase text-xs tracking-wider">
                  <th className="px-6 py-4">Item Name</th>
                  <th className="px-6 py-4">Structural Layout</th>
                  <th className="px-6 py-4">SKU Code</th>
                  <th className="px-6 py-4">On Hand Available</th>
                  <th className="px-6 py-4">Net Free Stock</th>
                  {/* <th className="px-6 py-4">Reserved Allocation</th> */}
                  <th className="px-6 py-4">Damaged Units</th>
                  <th className="px-6 py-4">Safety Limit</th>
                  <th className="px-6 py-4">Alert Banner Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {stock.map((item) => {
                  const netStock =
                    Number(item.quantity || 0) -
                    Number(item.reserved_quantity || 0);
                  const isLow = netStock <= Number(item.minimum_threshold || 0);

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-6 py-4 font-semibold text-gray-900">
                        {item.name}
                      </td>
                      <td className="px-6 py-4 uppercase text-xs font-bold text-gray-400">
                        {item.package_type}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-gray-500">
                        {item.sku}
                      </td>
                      <td className="px-6 py-4 font-bold text-gray-900">
                        {item.quantity}
                      </td>
                      <td className="px-6 py-4 text-gray-600 font-medium">
                        {netStock}{" "}
                        <span className="text-xs text-gray-400 font-normal">
                          ({item.reserved_quantity} held)
                        </span>
                      </td>
                      {/* <td className="px-6 py-4 text-gray-500">
                      {item.reserved_quantity}
                    </td> */}
                      <td className="px-6 py-4 font-medium text-rose-600">
                        {item.damaged_quantity || 0}
                      </td>
                      <td className="px-6 py-4 text-gray-400 font-mono">
                        {item.minimum_threshold}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-2.5 py-0.5 text-xs font-bold rounded-full border ${
                            isLow
                              ? "bg-rose-50 border-rose-200 text-rose-700"
                              : "bg-emerald-50 border-emerald-200 text-emerald-700"
                          }`}
                        >
                          {isLow
                            ? "Replenish Recommended"
                            : "Healthy Stock Levels"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
