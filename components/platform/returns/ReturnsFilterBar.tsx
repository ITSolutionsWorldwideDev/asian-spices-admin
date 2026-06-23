// components/platform/returns/ReturnsFilterBar.tsx

"use client";

import { useState } from "react";

type ReturnFilters = {
  search?: string;
  status?: string;
};

export default function ReturnsFilterBar({
  onApply,
}: {
  onApply: (filters: ReturnFilters) => void;
}) {
  const [filters, setFilters] = useState<ReturnFilters>({
    search: "",
    status: "",
  });

  const handleTextChange = (value: string) => {
    setFilters((prev) => ({ ...prev, search: value }));
  };

  const handleSelectChange = (value: string) => {
    const updated = { ...filters, status: value };
    setFilters(updated);
    onApply(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onApply(filters);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-wrap gap-3 items-center bg-gray-50 p-4 rounded-xl border mb-4"
    >
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Reference ID
        </label>
        <input
          type="text"
          value={filters.search}
          placeholder="Return # or Order #..."
          className="px-3 py-1.5 border rounded-lg text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-black w-64"
          onChange={(e) => handleTextChange(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Return State
        </label>
        <select
          value={filters.status}
          className="px-3 py-1.5 border rounded-lg text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-black min-w-[160px]"
          onChange={(e) => handleSelectChange(e.target.value)}
        >
          <option value="">All Workflow States</option>
          <option value="pending">Pending Audit</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="completed">Completed / Refunded</option>
        </select>
      </div>

      <div className="flex items-end h-full pt-5">
        <button
          type="submit"
          className="px-4 py-1.5 bg-black hover:bg-gray-800 text-white font-medium text-sm rounded-lg shadow transition cursor-pointer"
        >
          Apply Filters
        </button>
      </div>
    </form>
  );
}
