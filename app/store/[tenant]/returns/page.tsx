// app/store/[tenant]/returns/page.tsx

"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { RefreshCw, CheckCircle, AlertTriangle, Package } from "lucide-react";
import { useToast } from "@/core/ui";

export default function StoreReturnsInspectionPage() {
  const { tenant } = useParams();
  const [allocations, setAllocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const { showToast } = useToast();

  const fetchAllocations = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/store/returns`);
      if (!res.ok)
        throw new Error("Could not load your store return inventory.");
      const data = await res.json();
      setAllocations(data.allocations || []);
    } catch (err: any) {
      showToast("error", err.message || "Failed parsing return rows.");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchAllocations();
  }, [fetchAllocations]);

  const handleInspectItem = async (
    allocationId: string,
    resolution: "received" | "damaged",
  ) => {
    try {
      setActioningId(allocationId);
      const res = await fetch(`/api/store/returns`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ allocationId, resolution }),
      });

      const data = await res.json();
      if (!res.ok)
        throw new Error(data.error || "Failed inspecting unit allocation.");

      showToast(
        "success",
        resolution === "received"
          ? "Inventory restocked successfully."
          : "Item flagged as damaged.",
      );
      fetchAllocations();
    } catch (err: any) {
      showToast("error", err.message || "Failed updating stock entry.");
    } finally {
      setActioningId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending_return":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "item_received":
        return "bg-green-50 text-green-700 border-green-200";
      case "item_damaged":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className="pt-0 page-wrapper2 p-6">
      <div className="content">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h4 className="text-xl font-bold tracking-tight flex items-center gap-2">
              <Package className="text-orange-600" size={24} />
              Store Reverse Inspection Desk
            </h4>
            <p className="text-xs text-gray-500 mt-1">
              Verify incoming multi-tenant returned inventory parcels mapping to
              your branch node.
            </p>
          </div>
          <div className="text-xs font-semibold bg-gray-100 px-3 py-1.5 border rounded-lg uppercase tracking-wider text-gray-600">
            Node:{" "}
            <span className="text-black font-bold font-mono">{tenant}</span>
          </div>
        </div>

        <div className="card table-list-card bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="card-body p-0">
            <div className="overflow-x-auto">
              {loading ? (
                <div className="flex items-center justify-center py-24 space-x-3">
                  <RefreshCw className="animate-spin text-gray-500" size={20} />
                  <p className="text-gray-500 text-sm font-medium">
                    Scanning node records...
                  </p>
                </div>
              ) : allocations.length === 0 ? (
                <div className="text-center py-24 text-gray-400 font-medium text-sm">
                  No active incoming returned items routed to your shop.
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-sm">
                  <thead className="bg-gray-50 border-b text-xs font-semibold uppercase text-gray-600 tracking-wider">
                    <tr>
                      <th className="p-4">Return Number</th>
                      <th className="p-4">Order Ref</th>
                      <th className="p-4">Product Target Item</th>
                      <th className="p-4 text-center">Return Qty</th>
                      <th className="p-4">Allocation State</th>
                      <th className="p-4 text-right">Gatekeeper Audit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-gray-700">
                    {allocations.map((row) => (
                      <tr
                        key={row.allocation_id}
                        className="hover:bg-gray-50/60 transition"
                      >
                        <td className="p-4 font-mono font-bold text-gray-950">
                          {row.return_number}
                        </td>
                        <td className="p-4 font-mono text-gray-500">
                          #{row.order_number}
                        </td>
                        <td className="p-4 font-medium text-gray-800">
                          {row.product_name}
                        </td>
                        <td className="p-4 text-center font-bold text-gray-900">
                          {row.return_quantity}
                        </td>
                        <td className="p-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 border text-xs font-medium rounded-full ${getStatusBadge(row.status)}`}
                          >
                            {row.status.replace("_", " ")}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {row.status === "pending_return" ? (
                              <>
                                <button
                                  disabled={actioningId !== null}
                                  onClick={() =>
                                    handleInspectItem(
                                      row.allocation_id,
                                      "received",
                                    )
                                  }
                                  className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-700 border border-green-200 px-2.5 py-1 rounded-md hover:bg-green-100 transition font-medium disabled:opacity-50"
                                >
                                  <CheckCircle size={14} /> Accept & Restock
                                </button>
                                <button
                                  disabled={actioningId !== null}
                                  onClick={() =>
                                    handleInspectItem(
                                      row.allocation_id,
                                      "damaged",
                                    )
                                  }
                                  className="inline-flex items-center gap-1 text-xs bg-red-50 text-red-700 border border-red-200 px-2.5 py-1 rounded-md hover:bg-red-100 transition font-medium disabled:opacity-50"
                                >
                                  <AlertTriangle size={14} />{" "}
                                  Defective/Write-off
                                </button>
                              </>
                            ) : (
                              <span className="text-xs text-gray-400 font-medium italic">
                                Handled
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
