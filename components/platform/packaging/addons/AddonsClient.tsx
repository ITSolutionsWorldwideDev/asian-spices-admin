// components/platform/packaging/addons/AddonsClient.tsx

"use client";

import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

export default function AddonsClient({ addons, total, page, pageSize, search }: any) {
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
      {/* Header Panel */}
      <div className="page-header flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Packaging Addons</h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage packaging addons, custom cards, and localized production choices.
          </p>
        </div>
        <Link
          href="/platform/packaging/addons/new"
          className="btn btn-primary"
        >
          Add New Addon
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex gap-4">
        <input
          type="text"
          defaultValue={search}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search by addon name, type, or SKU..."
          className="max-w-md w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all"
        />
      </div>

      {/* Main Content Area */}
      {!addons.length ? (
        <div className="bg-white border border-gray-100 rounded-xl p-12 text-center shadow-sm">
          <p className="text-gray-400 font-medium text-sm">No functional addons catalog matches current filters.</p>
        </div>
      ) : (
        <>
          <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm text-gray-600">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-gray-700 font-semibold uppercase tracking-wider text-xs">
                    <th className="px-6 py-4">Addon Name</th>
                    <th className="px-6 py-4">Inventory SKU</th>
                    <th className="px-6 py-4">Categorization Type</th>
                    <th className="px-6 py-4">Unit Cost Price</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {addons.map((addon: any) => (
                    <tr key={addon.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">{addon.name}</td>
                      <td className="px-6 py-4 font-mono text-xs text-gray-500 tracking-tight">{addon.sku}</td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-slate-100 text-slate-800 capitalize">
                          {addon.addon_type?.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900">
                        €{Number(addon.cost_price || 0).toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                            addon.is_active
                              ? "bg-green-50 text-green-700 border-green-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}
                        >
                          {addon.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium">
                        <Link
                          href={`/platform/packaging/addons/${addon.id}`}
                          className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-md transition-colors"
                        >
                          Edit
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination Controls */}
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