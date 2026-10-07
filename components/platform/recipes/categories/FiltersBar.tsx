// components/platform/recipes/categories/FiltersBar.tsx

"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "react-feather";

interface FiltersBarProps {
  searchQuery?: string;
  setSearchQuery?: (value: string) => void;
  statusFilter?: string;
  setStatusFilter?: (value: string) => void;
  sortFilter?: string;
  setSortFilter?: (value: string) => void;
}

export default function FiltersBar({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  sortFilter,
  setSortFilter,
}: FiltersBarProps) {
  const router = useRouter();
  const params = useSearchParams();

  const isControlled = typeof setSearchQuery === "function";

  const currentSearch = isControlled ? (searchQuery || "") : (params.get("q") ?? "");
  const currentStatus = isControlled ? (statusFilter || "All Status") : (params.get("status") ?? "");
  const currentSort = isControlled ? (sortFilter || "Ascending") : (params.get("sort") ?? "Ascending");

  const updateSearch = (val: string) => {
    if (setSearchQuery) {
      setSearchQuery(val);
    } else {
      updateUrl("q", val);
    }
  };

  const updateStatus = (val: string) => {
    if (setStatusFilter) {
      setStatusFilter(val);
    } else {
      updateUrl("status", val);
    }
  };

  const updateSort = (val: string) => {
    if (setSortFilter) {
      setSortFilter(val);
    } else {
      updateUrl("sort", val);
    }
  };

  function updateUrl(key: string, value: string) {
    const p = new URLSearchParams(params.toString());

    if (value) {
      p.set(key, value);
    } else {
      p.delete(key);
    }

    router.push(`?${p.toString()}`);
  }

  const hasActiveFilters =
    Boolean(currentSearch) ||
    (currentStatus !== "All Status" && currentStatus !== "") ||
    (currentSort !== "Ascending" && currentSort !== "asc");

  const clearFilters = () => {
    if (isControlled) {
      setSearchQuery?.("");
      setStatusFilter?.("All Status");
      setSortFilter?.("Ascending");
    } else {
      router.push(window.location.pathname);
    }
  };

  return (
    <div className="flex flex-wrap gap-3 items-center justify-between w-full">
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative w-full sm:w-64">
          <input
            placeholder="Search categories..."
            value={currentSearch}
            onChange={(e) => updateSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
          />
          <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
        </div>

        <select
          value={currentStatus}
          onChange={(e) => updateStatus(e.target.value)}
          className="px-3 py-2 border rounded-md text-sm bg-white"
        >
          <option value="All Status">All Status</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>

        <select
          value={currentSort}
          onChange={(e) => updateSort(e.target.value)}
          className="px-3 py-2 border rounded-md text-sm bg-white"
        >
          <option value="Ascending">Sort: Ascending</option>
          <option value="Descending">Sort: Descending</option>
          <option value="Recently Added">Sort: Recently Added</option>
        </select>
      </div>

      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700 px-2 py-1 transition-colors"
        >
          <X size={14} /> Clear Filters
        </button>
      )}
    </div>
  );
}
