// components/platform/orders/FilterBar.tsx
"use client";

import { useState } from "react";

type Filters = {
  search?: string;
  status?: string;
  sort?: string;
};

export default function OrderFilterBar({
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
    <div className="flex flex-wrap gap-3 mb-4">
      <input
        placeholder="Search Order ID"
        className="px-3 py-2 border rounded text-sm"
        onChange={(e) => update("search", e.target.value)}
      />

      <select
        className="px-3 py-2 border rounded text-sm"
        onChange={(e) => update("status", e.target.value)}
      >
        <option value="">All Status</option>
        <option value="pending">Pending</option>
        <option value="confirmed">Confirmed</option>
        <option value="rejected">Rejected</option>
        <option value="partially_confirmed">Partial</option>
      </select>

      <select
        className="px-3 py-2 border rounded text-sm"
        onChange={(e) => update("sort", e.target.value)}
      >
        <option value="priority">Priority (Rejected first)</option>
        <option value="newest">Newest</option>
      </select>
    </div>
  );
}