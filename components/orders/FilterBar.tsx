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

  const [filters, setFilters] = useState<Filters>({
    search: "",
    product: "",
    status: "",
    sort: "",
  });

  const handleTextChange = (key: "search" | "product", value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleSelectChange = (key: "status" | "sort", value: string) => {
    const updated = { ...filters, [key]: value };
    setFilters(updated);
    onApply(updated); // Fires immediately for clean selection UX toggles
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onApply(filters); // Submits text input states to parent view container cleanly on demand
  };
  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap gap-3 items-center bg-gray-50 p-4 rounded-xl border mb-4">
      {/* Search Input Box */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Reference ID</label>
        <input
          type="text"
          value={filters.search}
          placeholder="Order #, transaction ID..."
          className="px-3 py-1.5 border rounded-lg text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-black"
          onChange={(e) => handleTextChange("search", e.target.value)}
        />
      </div>

      {/* Product Input Box */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Product Name</label>
        <input
          type="text"
          value={filters.product}
          placeholder="Filter by items purchased..."
          className="px-3 py-1.5 border rounded-lg text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-black"
          onChange={(e) => handleTextChange("product", e.target.value)}
        />
      </div>

      {/* Dynamic Status Dropdown Selector */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Lifecycle State</label>
        <select
          value={filters.status}
          className="px-3 py-1.5 border rounded-lg text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-black"
          onChange={(e) => handleSelectChange("status", e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending Payment</option>
          <option value="processing">Processing (Fulfillment)</option>
          <option value="rejected">Rejected/Bounced Nodes</option>
          <option value="shipped">Shipped</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {/* Sort Parameter Dropdown */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Ordering Sequence</label>
        <select
          value={filters.sort}
          className="px-3 py-1.5 border rounded-lg text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-black"
          onChange={(e) => handleSelectChange("sort", e.target.value)}
        >
          <option value="priority">Operational Priority Queue</option>
          <option value="newest">Created Date: Newest First</option>
          <option value="date_asc">Created Date: Oldest First</option>
          <option value="total_desc">Total Cash Amount: High → Low</option>
          <option value="total_asc">Total Cash Amount: Low → High</option>
        </select>
      </div>

      {/* Submission Core Run Triggers */}
      <div className="flex items-end h-full pt-5">
        <button
          type="submit"
          className="px-4 py-1.5 bg-black hover:bg-gray-800 text-white font-medium text-sm rounded-lg shadow transition duration-150 ease-in-out cursor-pointer"
        >
          Apply Filters
        </button>
      </div>
    </form>
  );
}
/* 
// const update = (key: keyof Filters, value: string) => {
  //   const updated = { ...filters, [key]: value };
  //   setFilters(updated);
  //   onApply(updated);
  // };

  return (
    <div className="flex flex-wrap gap-3 items-center">

      <input
        type="text"
        placeholder="Search order,  payment ref..."
        className="px-3 py-2 border rounded-md text-sm"
        onChange={(e) => update("search", e.target.value)}
      />


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




      <input
        type="text"
        placeholder="Product"
        className="px-3 py-2 border rounded-md text-sm"
        onChange={(e) => update("product", e.target.value)}
      />


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
*/