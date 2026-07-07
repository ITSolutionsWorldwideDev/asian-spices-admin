// // components/products/FilterBar.tsx

"use client";

import { useState, useEffect } from "react";

type Filters = {
  search?: string;
  category?: string;
  brand?: string;
  status?: string;
  sort?: string;
};

interface FilterBarProps {
  onApply: (filters: Filters) => void;
  initialValues?: Filters; // [ADDED] Accept initial values from URL-synced parent state
}

export default function FilterBar({ onApply, initialValues }: FilterBarProps) {
  const [filters, setFilters] = useState<Filters>(initialValues || {});

  // [ADDED] Sync the local filter state if the parent initialValues change (e.g. initial URL parse completes)
  useEffect(() => {
    if (initialValues) {
      setFilters(initialValues);
    }
  }, [initialValues]);

  const update = (key: keyof Filters, value: string) => {
    const updated = { ...filters, [key]: value };
    setFilters(updated);
    onApply(updated);
  };

  return (
    <div className="flex flex-wrap gap-3">
      <input
        placeholder="Search product / SKU"
        className="px-3 py-2 border rounded text-sm"
        value={filters.search || ""}
        onChange={(e) => update("search", e.target.value)}
      />

      <input
        placeholder="Category"
        className="px-3 py-2 border rounded text-sm"
        value={filters.category || ""}
        onChange={(e) => update("category", e.target.value)}
      />

      <input
        placeholder="Brand"
        className="px-3 py-2 border rounded text-sm"
        value={filters.brand || ""}
        onChange={(e) => update("brand", e.target.value)}
      />

      <select
        className="px-3 py-2 border rounded text-sm"
        value={filters.status || ""}
        onChange={(e) => update("status", e.target.value)}
      >
        <option value="">All Status</option>
        <option value="1">Active</option>
        <option value="0">Inactive</option>
      </select>

      <select
        className="px-3 py-2 border rounded text-sm"
        value={filters.sort || ""}
        onChange={(e) => update("sort", e.target.value)}
      >
        <option value="">Sort</option>
        <option value="newest">Newest</option>
        <option value="price_asc">Price ↑</option>
        <option value="price_desc">Price ↓</option>
      </select>
    </div>
  );
}
