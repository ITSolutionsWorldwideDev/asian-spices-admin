// app/platform/orders/page.tsx

"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import OrderFilterBar from "@/components/orders/FilterBar";
import { useToast } from "@/core/ui";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [filters, setFilters] = useState<any>({});
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const limit = 10;

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        ...filters,
      });

      const res = await fetch(`/api/platform/orders?${params}`);

      if (!res.ok)
        throw new Error("Server parameters returned processing error");

      const data = await res.json();

      setOrders(data.orders);
      setOrders(data.orders || []);
      setTotal(data.total || 0);
    } catch {
      showToast("error", "Failed to load products");
    } finally {
      setLoading(false);
    }
  }, [page, filters, showToast]);

  useEffect(() => {
    fetchOrders();
  }, [page, filters]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="page-wrapper">
      <div className="content p-6">
        {/* <h1 className="text-2xl font-bold mb-4">Orders</h1> */}

        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            System Order Registry
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Monitor cross-store routing events and process stuck order manual
            interventions.
          </p>
        </div>
        <div className="bg-gray-100 px-4 py-2 rounded-lg border text-sm font-medium">
          Total Tracks: <span className="text-blue-600">{total}</span>
        </div>

        {/* ✅ FILTER BAR */}
        <OrderFilterBar
          onApply={(f) => {
            setPage(1);
            setFilters(f);
          }}
        />

        {/* ✅ TABLE */}

        <div className="card-body">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center py-24 space-x-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black" />
                <p className="text-gray-500 font-medium">
                  Fetching registry balances...
                </p>
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-24 text-gray-400">
                No system tracking records match the active criteria.
              </div>
            ) : (
              <div className="bg-white rounded shadow overflow-hidden">

                <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 border-b text-xs font-semibold uppercase text-gray-600 tracking-wider">
                <tr>
                  <th className="p-4">Order String ID</th>
                  <th className="p-4">Routing State</th>
                  <th className="p-4">Payment</th>
                  <th className="p-4">Assigned Node</th>
                  <th className="p-4 text-center">Bounces</th>
                  <th className="p-4">Ingested Date</th>
                  <th className="p-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y text-sm text-gray-700">
                {orders.map((o) => {
                  // Operational warning condition for orders bouncing across stores repeatedly without successful dispatch
                  const isStuck = o.order_status === "processing" && Number(o.rejection_count) >= 3;
                  
                  return (
                    <tr key={o.id} className={`hover:bg-gray-50 transition ${isStuck ? "bg-amber-50/60 hover:bg-amber-50" : ""}`}>
                      <td className="p-4 font-mono font-bold text-gray-900">{o.order_number}</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                          o.order_status === "rejected" ? "bg-red-50 text-red-700 border-red-200" :
                          o.order_status === "processing" ? "bg-blue-50 text-blue-700 border-blue-200" :
                          o.order_status === "shipped" ? "bg-green-50 text-green-700 border-green-200" :
                          "bg-gray-50 text-gray-700 border-gray-200"
                        }`}>
                          {o.order_status}
                        </span>
                        {isStuck && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-amber-600 text-white animate-pulse">
                            STUCK IN LOOP
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className={`text-xs font-semibold ${o.payment_status === "paid" ? "text-green-600" : "text-gray-400"}`}>
                          {o.payment_status}
                          {/* // .toUpperCase() */}
                        </span>
                      </td>
                      <td className="p-4 font-medium text-gray-600">{o.store_name || "— (Unallocated)"}</td>
                      <td className="p-4 text-center">
                        <span className={`font-semibold px-2 py-0.5 rounded ${Number(o.rejection_count) > 0 ? "bg-red-50 text-red-600 font-bold" : "text-gray-400"}`}>
                          {o.rejection_count}
                        </span>
                      </td>
                      <td className="p-4 text-gray-500">{new Date(o.created_at).toLocaleDateString()}</td>
                      <td className="p-4 text-right">
                        <Link href={`./orders/${o.id}`} className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition">
                          Inspect Asset →
                        </Link>
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

        {/* ✅ PAGINATION ACTIONS */}
      <div className="flex justify-between items-center pt-2">
        <button
          disabled={page === 1 || loading}
          onClick={() => setPage((p) => p - 1)}
          className="px-4 py-2 border rounded-lg shadow-sm text-sm font-medium bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          Previous Page
        </button>
        <span className="text-sm text-gray-600 font-medium">
          Page {page} of {totalPages}
        </span>
        <button
          disabled={page === totalPages || loading}
          onClick={() => setPage((p) => p + 1)}
          className="px-4 py-2 border rounded-lg shadow-sm text-sm font-medium bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          Next Page
        </button>
      </div>

        



      </div>
    </div>
  );
}

/* 
<table className="w-full">
                  <thead className="bg-gray-100 text-xs uppercase">
                    <tr>
                      <th className="p-3 text-left">Order</th>
                      <th>Status</th>
                      <th>Store</th>
                      <th>Rejections</th>
                      <th>Date</th>
                      <th></th>
                    </tr>
                  </thead>

                  <tbody>
                    {orders.map((o) => (
                      <tr key={o.id} className="border-t hover:bg-gray-50">
                        <td className="p-3 font-medium">{o.order_number}</td>

                        <td>
                          <span
                            className={`px-2 py-1 text-xs rounded ${
                              o.order_status === "rejected"
                                ? "bg-red-100 text-red-600"
                                : o.order_status === "confirmed"
                                  ? "bg-green-100 text-green-600"
                                  : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {o.order_status}
                          </span>
                        </td>

                        <td>{o.store_name || "-"}</td>

                        <td className="text-center">
                          <span className="font-semibold">
                            {o.rejection_count}
                          </span>
                        </td>

                        <td className="text-sm text-gray-500">
                          {new Date(o.created_at).toLocaleDateString()}
                        </td>

                        <td>
                          <Link
                            href={`./orders/${o.id}`}
                            className="text-blue-600"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
*/

{/* ✅ PAGINATION */}
/*         <div className="flex justify-between items-center mt-4">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Prev
          </button>

          <span>
            Page {page} / {totalPages}
          </span>

          <button
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div> */