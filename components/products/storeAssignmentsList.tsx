// components/products/storeAssignmentsList.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import Table from "@/core/common/pagination/datatable";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { Download } from "react-feather";
import { TbCirclePlus } from "react-icons/tb";
import FilterBar from "./FilterBar";
import { useToast } from "@/core/ui";
import ProductImportModal from "./ProductImportModal";
import DiscountImportModal from "./DiscountImportModal";
import { exportToCsv } from "@/core/utils/exportCsv";

/* ------------------------------------
   Types
------------------------------------ */
type Assignment = {
  id: string;
  product_id: string;
  product_name: string;
  sku: string | null;
  description: string | null;
  base_price: number;
  price: number;
  discount_type: string | null;
  discount_value: number | null;
  store_id: string;
  store_name: string;
  status: number;
};

type Filters = {
  search?: string;
  category?: string;
  brand?: string;
  status?: string;
  sort?: string;
};

export default function StoreAssignmentsListComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<Filters>({
    search: searchParams.get("search") || "",
    category: searchParams.get("category") || "",
    brand: searchParams.get("brand") || "",
    status: searchParams.get("status") || "",
    sort: searchParams.get("sort") || "",
  });

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const [showImportModal, setShowImportModal] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);

  /* ------------------------------------
       Fetch Products
    ------------------------------------ */

  const fetchAssignments = useCallback(
    async (activeFilters: Filters) => {
      try {
        setLoading(true);

        const params = new URLSearchParams(
          Object.entries(activeFilters).filter(
            ([_, v]) => v !== undefined && v !== null && v !== "",
          ) as any,
        );

        const res = await fetch(`/api/store-assignments?${params.toString()}`);
        const data = await res.json();

        setAssignments(data.items || []);
      } catch {
        showToast("error", "Failed to load store assignments");
      } finally {
        setLoading(false);
      }
    },
    [showToast],
  );

  const handleApplyFilters = (newFilters: Filters) => {
    setFilters(newFilters);

    const params = new URLSearchParams();
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value) params.set(key, value.toString());
    });

    router.push(`/platform/store-assignments?${params.toString()}`);
  };

  useEffect(() => {
    fetchAssignments(filters);
  }, [filters, fetchAssignments]);

  const handleExportCsv = () => {
    exportToCsv<Assignment>(
      "store-assignments",
      [
        { title: "Product", dataIndex: "product_name" },
        { title: "SKU", dataIndex: "sku" },
        { title: "Description", dataIndex: "description" },
        {
          title: "Base Price",
          dataIndex: "base_price",
          format: (v) => `€${Number(v).toLocaleString()}`,
        },
        { title: "Assigned Store", dataIndex: "store_name" },
        {
          title: "Store Price",
          dataIndex: "price",
          format: (v) => `€${Number(v).toLocaleString()}`,
        },
      ],
      assignments,
    );
  };

  const columns = [
    {
      title: "Product",
      dataIndex: "product_name",
      width: 200,
      render: (text: string, record: Assignment) => (
        <Link
          href={`products/${record.product_id}`}
          title={text}
          className="block max-w-[180px] truncate text-blue-600 hover:underline"
        >
          {text}
        </Link>
      ),
      sorter: (a: Assignment, b: Assignment) =>
        a.product_name.localeCompare(b.product_name),
    },
    {
      title: "SKU",
      dataIndex: "sku",
      width: 120,
      sorter: (a: Assignment, b: Assignment) =>
        (a.sku || "").localeCompare(b.sku || ""),
    },
    {
      title: "Description",
      dataIndex: "description",
      width: 260,
      render: (description: string | null) => (
        <span
          title={description || ""}
          className="block max-w-[240px] truncate text-gray-600"
        >
          {description || "-"}
        </span>
      ),
    },
    {
      title: "Base Price",
      dataIndex: "base_price",
      width: 100,
      sorter: (a: Assignment, b: Assignment) => a.base_price - b.base_price,
      render: (base_price: number) => `€${Number(base_price).toLocaleString()}`,
    },
    {
      title: "Assigned Store",
      dataIndex: "store_name",
      width: 180,
      sorter: (a: Assignment, b: Assignment) =>
        a.store_name.localeCompare(b.store_name),
    },
    {
      title: "Store Price",
      dataIndex: "price",
      width: 100,
      sorter: (a: Assignment, b: Assignment) => a.price - b.price,
      render: (price: number) => `€${Number(price).toLocaleString()}`,
    },
  ];

  return (
    <>
      <div className="pt-0 page-wrapper">
        <div className="content">
          {/* ------------------------- PAGE HEADER ------------------------- */}
          <div className="page-header flex flex-wrap justify-between items-center gap-3 mb-4">
            <div>
              <h4 className="text-lg font-semibold">Store Assignments</h4>
              <h6 className="text-gray-500">
                Manage which stores each product is assigned to, and at what price
              </h6>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href="/products/new"
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                <TbCirclePlus className="mr-1" size={18} />
                Add Product
              </Link>

              <button
                onClick={() => setShowImportModal(true)}
                className="flex items-center px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              >
                <Download className="mr-2" />
                Import Product
              </button>

              <button
                onClick={() => setShowDiscountModal(true)}
                className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 text-sm font-medium transition-colors"
              >
                <Download className="mr-2" size={16} />
                Import Discounts
              </button>

              <button
                onClick={handleExportCsv}
                className="flex items-center px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-900 text-sm font-medium transition-colors"
              >
                <Download className="mr-2" size={16} />
                Export
              </button>
            </div>
          </div>

          {/* ------------------------- FILTER BAR ------------------------- */}
          <div className="card table-list-card mb-4">
            <div className="card-header flex flex-wrap justify-between items-center gap-3">
              <FilterBar onApply={handleApplyFilters} initialValues={filters} />
            </div>
            {/* ------------------------- TABLE ------------------------- */}
            <div className="card-body">
              {loading ? (
                <div className="flex items-center justify-center py-24 space-x-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black" />
                  <p className="text-gray-500 font-medium">Loading...</p>
                </div>
              ) : (
                <Table columns={columns} dataSource={assignments} rowKey="id" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------- IMPORT MODAL ------------------------- */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <ProductImportModal
            onClose={() => setShowImportModal(false)}
            onSuccess={() => {
              fetchAssignments(filters);
              showToast("success", "Products imported successfully");
            }}
          />
        </div>
      )}

      {/* ------------------------- DISCOUNT IMPORT MODAL ------------------------- */}
      {showDiscountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <DiscountImportModal
            onClose={() => setShowDiscountModal(false)}
            onSuccess={() => {
              fetchAssignments(filters);
              showToast(
                "success",
                "Product pricing discount matrix updated successfully",
              );
            }}
          />
        </div>
      )}
    </>
  );
}
