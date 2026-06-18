// components/customers/CustomerFilterBar.tsx

"use client";

import { useState } from "react";

type Filters = {
  search?: string;
  customer_type?: string;
  sort?: string;
};

export default function CustomerFilterBar({
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
        type="text"
        placeholder="Search name, email, phone"
        className="px-3 py-2 border rounded-md text-sm"
        onChange={(e) => update("search", e.target.value)}
      />

      {/* <select
        className="px-3 py-2 border rounded-md text-sm"
        onChange={(e) => update("status", e.target.value)}
      >
        <option value="">All Status</option>
        <option value="ACTIVE">Active</option>
        <option value="BLOCKED">Blocked</option>
      </select> */}
      <select
        className="px-3 py-2 border rounded-md text-sm"
        onChange={(e) => update("customer_type", e.target.value)}
      >
        <option value="">All Types</option>
        <option value="B2C">B2C</option>
        <option value="B2B">B2B</option>
      </select>

      <select
        className="px-3 py-2 border rounded-md text-sm"
        onChange={(e) => update("sort", e.target.value)}
      >
        <option value="">Sort</option>
        <option value="date_desc">Newest</option>
        <option value="date_asc">Oldest</option>
      </select>
    </div>
  );
}
