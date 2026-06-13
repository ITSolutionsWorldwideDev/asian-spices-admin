// // apps/admin/components/products/FilterBar.tsx

"use client";

import { useState } from "react";

type Filters = {
  search?: string;
  category?: string;
  brand?: string;
  status?: string;
  sort?: string;
};

export default function FilterBar({
  onApply,
}: {
  onApply: (filters: Filters) => void;
}) {
  const [filters, setFilters] = useState<Filters>({});

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
        onChange={(e) => update("search", e.target.value)}
      />

      <input
        placeholder="Category"
        className="px-3 py-2 border rounded text-sm"
        onChange={(e) => update("category", e.target.value)}
      />

      <input
        placeholder="Brand"
        className="px-3 py-2 border rounded text-sm"
        onChange={(e) => update("brand", e.target.value)}
      />

      <select
        className="px-3 py-2 border rounded text-sm"
        onChange={(e) => update("status", e.target.value)}
      >
        <option value="">All Status</option>
        <option value="1">Active</option>
        <option value="0">Inactive</option>
      </select>

      <select
        className="px-3 py-2 border rounded text-sm"
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
