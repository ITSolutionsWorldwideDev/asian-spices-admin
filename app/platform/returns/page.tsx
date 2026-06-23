// app/platform/returns/page.tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import ReturnsFilterBar from "@/components/platform/returns/ReturnsFilterBar";
import { useToast } from "@/core/ui";
import { RefreshCw, ArrowLeftRight } from "lucide-react";

export default function AdminReturnsPage() {
  const [returns, setReturns] = useState<any[]>([]);
  const [filters, setFilters] = useState<any>({});
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const limit = 10;

  const fetchReturns = useCallback(async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        ...filters,
      });

      const res = await fetch(`/api/platform/returns?${params}`);
      if (!res.ok) throw new Error("Server error fetching return orders");

      const data = await res.json();
      setReturns(data.returns || []);
      setTotal(data.total || 0);
    } catch (err: any) {
      showToast("error", err.message || "Failed to load returns");
    } finally {
      setLoading(false);
    }
  }, [page, filters, showToast]);

  useEffect(() => {
    fetchReturns();
  }, [page, filters]);

  const totalPages = Math.ceil(total / limit) || 1;

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "approved":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "completed":
        return "bg-green-50 text-green-700 border-green-200";
      case "rejected":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className="page-wrapper">
      <div className="content p-6">
        {/* Title Block Header Layout Section */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <ArrowLeftRight className="text-gray-600" size={28} />
              Reverse Logistics Registry
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Audit global customer return entries, manage cancellations, and
              track store-level restock states.
            </p>
          </div>
          <div className="bg-gray-100 px-4 py-2 rounded-lg border text-sm font-medium">
            Active Filings:{" "}
            <span className="text-blue-600 font-bold">{total}</span>
          </div>
        </div>

        {/* Filter Action Handling Trigger Anchor */}
        <ReturnsFilterBar
          onApply={(f) => {
            setPage(1);
            setFilters(f);
          }}
        />

        {/* Core Main Listing Records Datatable Row Grid Context */}
        <div className="card-body bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center py-24 space-x-3">
                <RefreshCw className="animate-spin text-gray-500" size={22} />
                <p className="text-gray-500 font-medium">
                  Fetching reverse inventory entries...
                </p>
              </div>
            ) : returns.length === 0 ? (
              <div className="text-center py-24 text-gray-400 font-medium">
                No active return requests found matching search selection.
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 border-b text-xs font-semibold uppercase text-gray-600 tracking-wider">
                  <tr>
                    <th className="p-4">Return ID Reference</th>
                    <th className="p-4">Parent Order ID</th>
                    <th className="p-4">Customer Filename</th>
                    <th className="p-4">Items Count</th>
                    <th className="p-4">Workflow State</th>
                    <th className="p-4">Filing Date</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-sm text-gray-700">
                  {returns.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50/70 transition">
                      <td className="p-4 font-mono font-bold text-gray-950">
                        {r.return_number}
                      </td>
                      <td className="p-4 font-mono text-gray-600">
                        #{r.order_number}
                      </td>
                      <td className="p-4 font-medium text-gray-800">
                        {r.customer_name || "Guest Checkout"}
                      </td>
                      <td className="p-4">
                        <span className="font-semibold text-gray-900">
                          {Array.isArray(r.items)
                            ? r.items.reduce(
                                (acc: number, item: any) =>
                                  acc + (item.quantity || 0),
                                0,
                              )
                            : 0}
                        </span>{" "}
                        items
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusStyle(r.status)}`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="p-4 text-gray-500">
                        {new Date(r.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-right">
                        <Link
                          href={`/platform/orders/${r.order_id}`}
                          className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition"
                        >
                          Audit Source Order →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Dynamic Pagination Actions Area Row Box Container */}
        <div className="flex justify-between items-center pt-6">
          <button
            disabled={page === 1 || loading}
            onClick={() => setPage((p) => p - 1)}
            className="px-4 py-2 border rounded-lg shadow-sm text-sm font-medium bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
          >
            Previous Page
          </button>
          <span className="text-sm text-gray-600 font-medium">
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page === totalPages || loading}
            onClick={() => setPage((p) => p + 1)}
            className="px-4 py-2 border rounded-lg shadow-sm text-sm font-medium bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
          >
            Next Page
          </button>
        </div>
      </div>
    </div>
  );
}
