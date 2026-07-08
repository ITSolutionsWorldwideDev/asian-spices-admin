// components/category/FilterBar.tsx
"use client";

import { Menu } from "@headlessui/react";
import { Search, X } from "react-feather";

interface FilterBarProps {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  sortFilter: string;
  setSortFilter: (value: string) => void;
}

export default function FilterBar({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  sortFilter,
  setSortFilter,
}: FilterBarProps) {
  const filterItems = {
    status: ["All Status", "Active", "InActive"],
    sort: [
      "Recently Added",
      "Ascending",
      "Descending",
      "Last Month",
      "Last 7 Days",
    ],
  };

  // Helper to determine what label to show on the dropdown button
  const getButtonLabel = (label: string) => {
    if (label === "status") return statusFilter;
    if (label === "sort") return sortFilter;
    return label.charAt(0).toUpperCase() + label.slice(1);
  };

  // Helper to handle selection changes
  const handleSelect = (type: string, item: string) => {
    if (type === "status") setStatusFilter(item);
    if (type === "sort") setSortFilter(item);
  };

  const hasActiveFilters =
    searchQuery ||
    statusFilter !== "All Status" ||
    sortFilter !== "Recently Added";

  return (
    <div className="flex flex-wrap gap-3 items-center justify-between w-full">
      {/* Left / Center side: Search bar & Dropdowns */}
      <div className="flex flex-wrap gap-2 items-center">
        {/* Search Bar Input */}
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
          />
          <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
        </div>

        {/* Headless UI Dropdowns */}
        {Object.entries(filterItems).map(([label, items]) => (
          <Menu
            key={label}
            as="div"
            className="relative inline-block text-left"
          >
            <Menu.Button className="px-3 py-2 bg-white border rounded-md shadow-sm text-sm hover:bg-gray-50 flex items-center gap-1 font-medium text-gray-700">
              <span className="text-gray-400 font-normal capitalize">
                {label}:
              </span>{" "}
              {getButtonLabel(label)}
            </Menu.Button>

            <Menu.Items className="absolute left-0 mt-2 w-48 bg-white shadow-lg rounded-md border focus:outline-none z-50 py-1">
              {items.map((item) => (
                <Menu.Item key={item}>
                  {({ active }) => (
                    <button
                      type="button"
                      onClick={() => handleSelect(label, item)}
                      className={`block w-full text-left px-4 py-2 text-sm ${
                        active ? "bg-gray-100 text-gray-900" : "text-gray-700"
                      } ${
                        getButtonLabel(label) === item
                          ? "font-semibold text-blue-600 bg-blue-50/50"
                          : ""
                      }`}
                    >
                      {item}
                    </button>
                  )}
                </Menu.Item>
              ))}
            </Menu.Items>
          </Menu>
        ))}
      </div>

      {/* Clear Filters Button */}
      {hasActiveFilters && (
        <button
          onClick={() => {
            setSearchQuery("");
            setStatusFilter("All Status");
            setSortFilter("Recently Added");
          }}
          className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700 px-2 py-1 transition-colors"
        >
          <X size={14} /> Clear Filters
        </button>
      )}
    </div>
  );
}

/* "use client";

import { Menu } from "@headlessui/react";
import Link from "next/link";

export default function FilterBar() {
  const filterItems = {
    status: ["Active", "InActive"],
    sort: ["Recently Added", "Ascending", "Descending", "Last Month", "Last 7 Days"],
  };

  return (
    <div className="flex flex-wrap gap-2 align-items-center">
    
      {Object.entries(filterItems).map(([label, items]) => (
        <Menu key={label} as="div" className="relative inline-block text-right">
          <Menu.Button className="px-3 py-2 bg-white border rounded-md shadow-sm text-sm hover:bg-gray-50">
            {label.charAt(0).toUpperCase() + label.slice(1)}
          </Menu.Button>

          <Menu.Items className="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-md border focus:outline-none z-50">
            {items.map((item) => (
              <Menu.Item key={item}>
                {({ active }) => (
                  <Link
                    href="#"
                    className={`block px-4 py-2 text-sm rounded-md ${
                      active ? "bg-gray-100 text-gray-900" : "text-gray-700"
                    }`}
                  >
                    {item}
                  </Link>
                )}
              </Menu.Item>
            ))}
          </Menu.Items>
        </Menu>
      ))}
    </div>
  );
}
 */
