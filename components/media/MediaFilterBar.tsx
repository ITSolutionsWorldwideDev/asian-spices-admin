// components/media/MediaFilterBar.tsx

"use client";

import { Menu } from "@headlessui/react";
import { Search, X } from "react-feather";

interface MediaFilterBarProps {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  fileTypeFilter: string;
  setFileTypeFilter: (value: string) => void;
  sortFilter: string;
  setSortFilter: (value: string) => void;
}

export default function MediaFilterBar({
  searchQuery,
  setSearchQuery,
  fileTypeFilter,
  setFileTypeFilter,
  sortFilter,
  setSortFilter,
}: MediaFilterBarProps) {
  const filterItems = {
    type: ["All Types", "Images", "PDFs", "Others"],
    sort: ["Recently Added", "Oldest", "Alphabetical (A-Z)"],
  };

  const getButtonLabel = (label: string) => {
    if (label === "type") return fileTypeFilter;
    if (label === "sort") return sortFilter;
    return label.charAt(0).toUpperCase() + label.slice(1);
  };

  const handleSelect = (type: string, item: string) => {
    if (type === "type") setFileTypeFilter(item);
    if (type === "sort") setSortFilter(item);
  };

  const hasActiveFilters =
    searchQuery ||
    fileTypeFilter !== "All Types" ||
    sortFilter !== "Recently Added";

  return (
    <div className="flex flex-wrap gap-3 items-center justify-between w-full bg-white p-4 rounded-xl border border-gray-200">
      {/* Search Input & Dropdowns */}
      <div className="flex flex-wrap gap-2 items-center w-full sm:w-auto">
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="Search files by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white text-gray-900"
          />
          <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
        </div>

        {Object.entries(filterItems).map(([label, items]) => (
          <Menu
            key={label}
            as="div"
            className="relative inline-block text-right w-full sm:w-auto"
          >
            <Menu.Button className="w-full sm:w-auto px-3 py-2 bg-white border border-gray-200 rounded-md shadow-sm text-sm hover:bg-gray-50 flex items-center justify-between sm:justify-start gap-1 font-medium text-gray-700">
              <span className="text-gray-400 font-normal capitalize">
                {label}:
              </span>{" "}
              {getButtonLabel(label)}
            </Menu.Button>

            <Menu.Items className="absolute left-0 mt-2 w-48 bg-white shadow-lg rounded-md border border-gray-100 focus:outline-none z-50 py-1">
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

      {/* Clear Action Button */}
      {hasActiveFilters && (
        <button
          onClick={() => {
            setSearchQuery("");
            setFileTypeFilter("All Types");
            setSortFilter("Recently Added");
          }}
          className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700 px-2 py-1 transition-colors ml-auto sm:ml-0"
        >
          <X size={14} /> Clear Filters
        </button>
      )}
    </div>
  );
}
