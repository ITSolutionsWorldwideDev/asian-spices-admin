// apps/admin/components/platform/packaging/inventory/InventoryClient.tsx

"use client";

import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

export default function InventoryClient({
  inventory,
  total,
  page,
  pageSize,
  search,
}: any) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const totalPages = Math.ceil(total / pageSize);

  const handleSearch = (term: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", "1");
    if (term) {
      params.set("q", term);
    } else {
      params.delete("q");
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      {/* Header Summary View */}
      <div className="page-header flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Packaging Inventory Ledger
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Monitor functional packaging stock levels and safety indicators
            across partner branches.
          </p>
        </div>
      </div>

      {/* Realtime Search Filtering */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <input
          type="text"
          defaultValue={search}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Filter by store title, wrapper label or SKU..."
          className="max-w-md w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all"
        />
      </div>

      {/* Main Table Segment */}
      {!inventory.length ? (
        <div className="bg-white border border-gray-100 rounded-xl p-12 text-center shadow-sm">
          <p className="text-gray-400 font-medium text-sm">
            No inventory records match your filters.
          </p>
        </div>
      ) : (
        <>
          <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm text-gray-600">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-gray-700 font-semibold uppercase tracking-wider text-xs">
                    <th className="px-6 py-4">Store Location</th>
                    <th className="px-6 py-4">Packaging Type</th>
                    <th className="px-6 py-4">SKU / Code</th>
                    <th className="px-6 py-4">Available</th>
                    <th className="px-6 py-4">Reserved</th>
                    <th className="px-6 py-4">Damaged</th>
                    <th className="px-6 py-4">Safety Limit</th>
                    <th className="px-6 py-4">Status Flag</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {inventory.map((item: any) => {
                    // Safe parsing for mathematical consistency
                    const totalQty = Number(item.quantity || 0);
                    const reservedQty = Number(item.reserved_quantity || 0);
                    const minThreshold = Number(item.minimum_threshold || 0);

                    const calculatedNetAvailable = totalQty - reservedQty;
                    const isLowStock = calculatedNetAvailable <= minThreshold;

                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-gray-50/70 transition-colors"
                      >
                        <td className="px-6 py-4 font-medium text-gray-900">
                          {item.store_name}
                        </td>
                        <td className="px-6 py-4 font-medium text-gray-700">
                          {item.packaging_name}
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-gray-400 tracking-tight">
                          {item.packaging_code}
                        </td>
                        <td className="px-6 py-4 font-semibold text-gray-900">
                          {totalQty}
                        </td>
                        <td className="px-6 py-4 text-gray-500">
                          {reservedQty}
                        </td>
                        <td className="px-6 py-4 text-red-500 font-medium">
                          {item.damaged_quantity || 0}
                        </td>
                        <td className="px-6 py-4 text-gray-400">
                          {minThreshold}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                              isLowStock
                                ? "bg-rose-50 text-rose-700 border-rose-200"
                                : "bg-emerald-50 text-emerald-700 border-emerald-200"
                            }`}
                          >
                            {isLowStock ? "Low Stock Trigger" : "Healthy Stock"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination Engine with Persistent Query Filters */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-1.5 mt-4">
              {Array.from({ length: totalPages }).map((_, i) => {
                const pageNum = i + 1;
                const isCurrent = page === pageNum;
                return (
                  <Link
                    key={i}
                    href={`?page=${pageNum}${search ? `&q=${encodeURIComponent(search)}` : ""}`}
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
