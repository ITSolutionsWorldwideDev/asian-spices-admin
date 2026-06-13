// apps/admin/components/orders/FilterBar.tsx
"use client";

import { useState } from "react";

type Filters = {
  search?: string;
  customer?: string;
  product?: string;
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
    <div className="flex flex-wrap gap-3 items-center">
      {/* Search */}
      <input
        type="text"
        placeholder="Search order,  payment ref..."
        className="px-3 py-2 border rounded-md text-sm"
        onChange={(e) => update("search", e.target.value)}
      />{/* customer, */}

      {/* Status */}
      <select
        className="px-3 py-2 border rounded-md text-sm"
        onChange={(e) => update("status", e.target.value)}
      >
        <option value="">All Status</option>
        <option value="PENDING">Pending</option>
        <option value="PAID">Paid</option>
        <option value="SHIPPED">Shipped</option>
        <option value="DELIVERED">Delivered</option>
      </select>

      {/* Customer */}
      {/* <input
        type="text"
        placeholder="Customer"
        className="px-3 py-2 border rounded-md text-sm"
        onChange={(e) => update("customer", e.target.value)}
      /> */}

      {/* Product */}
      <input
        type="text"
        placeholder="Product"
        className="px-3 py-2 border rounded-md text-sm"
        onChange={(e) => update("product", e.target.value)}
      />

      {/* Sort */}
      <select
        className="px-3 py-2 border rounded-md text-sm"
        onChange={(e) => update("sort", e.target.value)}
      >
        <option value="">Sort By</option>
        <option value="date_desc">Newest</option>
        <option value="date_asc">Oldest</option>
        <option value="total_desc">Total High → Low</option>
        <option value="total_asc">Total Low → High</option>
      </select>
    </div>
  );
}
