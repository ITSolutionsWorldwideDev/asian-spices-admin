// components/subcategory/SubcategoryFilterBar.tsx
"use client";

import { Menu } from "@headlessui/react";
import { Search, X } from "react-feather";

type Category = {
  id: string;
  name: string;
};

interface SubcategoryFilterBarProps {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  sortFilter: string;
  setSortFilter: (value: string) => void;
  categoryFilter: string;
  setCategoryFilter: (value: string) => void;
  categoriesList: Category[];
}

export default function SubcategoryFilterBar({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  sortFilter,
  setSortFilter,
  categoryFilter,
  setCategoryFilter,
  categoriesList,
}: SubcategoryFilterBarProps) {
  const staticFilters = {
    status: ["All Status", "Active", "InActive"],
    sort: [
      "Recently Added",
      "Ascending",
      "Descending",
      "Last Month",
      "Last 7 Days",
    ],
  };

  // Find the legible name for current active Category selection
  const getCategoryLabel = () => {
    if (categoryFilter === "All Categories") return "All Categories";
    const match = categoriesList.find((c) => c.id === categoryFilter);
    return match ? match.name : "All Categories";
  };

  const hasActiveFilters =
    searchQuery ||
    statusFilter !== "All Status" ||
    sortFilter !== "Recently Added" ||
    categoryFilter !== "All Categories";

  return (
    <div className="flex flex-wrap gap-3 items-center justify-between w-full">
      <div className="flex flex-wrap gap-2 items-center">
        {/* Search Bar Input */}
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="Search subcategories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
          />
          <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
        </div>

        {/* 1. Dynamic Parent Category Dropdown Filter */}
        <Menu as="div" className="relative inline-block text-right">
          <Menu.Button className="px-3 py-2 bg-white border rounded-md shadow-sm text-sm hover:bg-gray-50 flex items-center gap-1 font-medium text-gray-700">
            <span className="text-gray-400 font-normal">Category:</span>{" "}
            {getCategoryLabel()}
          </Menu.Button>
          <Menu.Items className="absolute left-0 mt-2 w-52 bg-white shadow-lg rounded-md border focus:outline-none z-50 py-1 max-h-60 overflow-y-auto">
            <Menu.Item>
              {({ active }) => (
                <button
                  type="button"
                  onClick={() => setCategoryFilter("All Categories")}
                  className={`block w-full text-left px-4 py-2 text-sm ${
                    active ? "bg-gray-100 text-gray-900" : "text-gray-700"
                  } ${categoryFilter === "All Categories" ? "font-semibold text-blue-600 bg-blue-50/50" : ""}`}
                >
                  All Categories
                </button>
              )}
            </Menu.Item>
            {categoriesList.map((cat) => (
              <Menu.Item key={cat.id}>
                {({ active }) => (
                  <button
                    type="button"
                    onClick={() => setCategoryFilter(cat.id)}
                    className={`block w-full text-left px-4 py-2 text-sm ${
                      active ? "bg-gray-100 text-gray-900" : "text-gray-700"
                    } ${categoryFilter === cat.id ? "font-semibold text-blue-600 bg-blue-50/50" : ""}`}
                  >
                    {cat.name}
                  </button>
                )}
              </Menu.Item>
            ))}
          </Menu.Items>
        </Menu>

        {/* 2. Static Status & Sort Dropdowns */}
        {Object.entries(staticFilters).map(([label, items]) => {
          const currentVal = label === "status" ? statusFilter : sortFilter;
          return (
            <Menu
              key={label}
              as="div"
              className="relative inline-block text-right"
            >
              <Menu.Button className="px-3 py-2 bg-white border rounded-md shadow-sm text-sm hover:bg-gray-50 flex items-center gap-1 font-medium text-gray-700">
                <span className="text-gray-400 font-normal capitalize">
                  {label}:
                </span>{" "}
                {currentVal}
              </Menu.Button>
              <Menu.Items className="absolute left-0 mt-2 w-48 bg-white shadow-lg rounded-md border focus:outline-none z-50 py-1">
                {items.map((item) => (
                  <Menu.Item key={item}>
                    {({ active }) => (
                      <button
                        type="button"
                        onClick={() =>
                          label === "status"
                            ? setStatusFilter(item)
                            : setSortFilter(item)
                        }
                        className={`block w-full text-left px-4 py-2 text-sm ${
                          active ? "bg-gray-100 text-gray-900" : "text-gray-700"
                        } ${currentVal === item ? "font-semibold text-blue-600 bg-blue-50/50" : ""}`}
                      >
                        {item}
                      </button>
                    )}
                  </Menu.Item>
                ))}
              </Menu.Items>
            </Menu>
          );
        })}
      </div>

      {/* Clear Trigger */}
      {hasActiveFilters && (
        <button
          onClick={() => {
            setSearchQuery("");
            setStatusFilter("All Status");
            setSortFilter("Recently Added");
            setCategoryFilter("All Categories");
          }}
          className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700 px-2 py-1 transition-colors"
        >
          <X size={14} /> Clear Filters
        </button>
      )}
    </div>
  );
}
