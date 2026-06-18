// components/platform/packaging/orders/PackagingOrdersClient.tsx

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

export default function PackagingOrdersClient({
  orders,
  total,
  page,
  pageSize,
  search,
  statusFilter,
}: any) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const totalPages = Math.ceil(total / pageSize);

  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const applyFilters = (updates: { q?: string; status?: string }) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", "1"); // reset to page 1 on lookup criteria variations

    if (updates.q !== undefined) {
      if (updates.q) params.set("q", updates.q);
      else params.delete("q");
    }

    if (updates.status !== undefined) {
      if (updates.status) params.set("status", updates.status);
      else params.delete("status");
    }

    router.push(`${pathname}?${params.toString()}`);
  };

  const handleStatusChange = async (id: string, nextStatus: string) => {
    setUpdatingId(id);
    try {
      const res = await fetch("/api/platform/packaging/orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: nextStatus }),
      });
      const data = await res.json();
      if (data.success) {
        router.refresh();
      } else {
        alert(data.error || "Execution status tracking error.");
      }
    } catch (err) {
      alert("Failed transmission route verification link.");
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "packed":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "shipped":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "cancelled":
        return "bg-rose-50 text-rose-700 border-rose-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Title Segment Block */}
      <div className="page-header flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Packaging Orders Dispatch Ledger
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Track automated container decisions, structural decoration
            selections, and individual layout realization metrics.
          </p>
        </div>
      </div>

      {/* Grid Filtering Parameters Panel */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col sm:flex-row gap-4 items-center">
        <div className="w-full sm:flex-1">
          <input
            type="text"
            defaultValue={search}
            onChange={(e) => applyFilters({ q: e.target.value })}
            placeholder="Search matching items by order number, branch location, box layout title..."
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all"
          />
        </div>
        <div className="w-full sm:w-64">
          <select
            defaultValue={statusFilter}
            onChange={(e) => applyFilters({ status: e.target.value })}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm bg-white transition-all"
          >
            <option value="">All Flow Status Conditions</option>
            <option value="pending">Pending Assignment</option>
            <option value="packed">Packed Container</option>
            <option value="shipped">Shipped Transit</option>
            <option value="cancelled">Cancelled Assignment</option>
          </select>
        </div>
      </div>

      {/* Main Ledger Table Render Segment */}
      {!orders.length ? (
        <div className="bg-white border border-gray-100 rounded-xl p-12 text-center shadow-sm">
          <p className="text-gray-400 font-medium text-sm">
            No matching packaging orders detected.
          </p>
        </div>
      ) : (
        <>
          <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm text-gray-600">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-gray-700 font-semibold uppercase tracking-wider text-xs">
                    <th className="px-6 py-4">Order Identification</th>
                    <th className="px-6 py-4">Fulfillment Hub</th>
                    <th className="px-6 py-4">Box / Container Standard</th>
                    <th className="px-6 py-4">Premium Ribbon Layer</th>
                    <th className="px-6 py-4">Assigned Unit Cost</th>
                    <th className="px-6 py-4">Fulfillment Status</th>
                    <th className="px-6 py-4">Creation Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {orders.map((order: any) => (
                    <tr
                      key={order.id}
                      className="hover:bg-gray-50/70 transition-colors"
                    >
                      <td className="px-6 py-4 font-bold text-blue-600 hover:underline">
                        <Link href={`/platform/orders/${order.order_id}`}>
                          #{order.order_number}
                        </Link>
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {order.store_name}
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-700">
                        {order.packaging_name}
                      </td>
                      <td className="px-6 py-4 text-gray-500 italic text-xs">
                        {order.ribbon_name ? (
                          <span className="text-purple-600 font-medium not-italic">
                            {order.ribbon_name}
                          </span>
                        ) : (
                          "Standard Tape Seal"
                        )}
                      </td>
                      <td className="px-6 py-4 font-mono font-medium text-gray-900">
                        €{Number(order.packaging_cost || 0).toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize ${getStatusStyle(order.status)}`}
                          >
                            {order.status}
                          </span>

                          {/* Quick-action inline processing override controls */}
                          <select
                            disabled={updatingId === order.id}
                            value={order.status}
                            onChange={(e) =>
                              handleStatusChange(order.id, e.target.value)
                            }
                            className="text-xs bg-gray-50 border border-gray-200 rounded px-1.5 py-0.5 outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer text-gray-500 disabled:opacity-50"
                          >
                            <option value="pending">Pending</option>
                            <option value="packed">Packed</option>
                            <option value="shipped">Shipped</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-400 font-mono text-xs">
                        {new Date(order.created_at).toLocaleDateString(
                          undefined,
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination Engine Component with Preserved Scope Filter Variables */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-1.5 mt-4">
              {Array.from({ length: totalPages }).map((_, i) => {
                const pageNum = i + 1;
                const isCurrent = page === pageNum;

                const queryParams = new URLSearchParams(
                  searchParams.toString(),
                );
                queryParams.set("page", pageNum.toString());

                return (
                  <Link
                    key={i}
                    href={`?${queryParams.toString()}`}
                    className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      isCurrent
                        ? "bg-blue-600 text-white shadow-sm shadow-blue-500/10"
                        : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {pageNum}
                  </Link>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
