// components/products/productlist.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import Table from "@/core/common/pagination/datatable";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { Download, Edit, Eye, Trash2 } from "react-feather";
import { TbCirclePlus, TbTrash } from "react-icons/tb";
import FilterBar from "./FilterBar";
import { useToast } from "@/core/ui";
import ProductImportModal from "./ProductImportModal";
import DiscountImportModal from "./DiscountImportModal";
import { exportToCsv } from "@/core/utils/exportCsv";

/* ------------------------------------
   Types
------------------------------------ */
type Product = {
  id: number;
  name: string;
  sku: string;
  item_code: string;
  category: string;
  subcategory: string;
  brand: string;
  base_price: number;
  quantity: number;
  status: number;
};

type Filters = {
  search?: string;
  category?: string;
  brand?: string;
  status?: string;
  sort?: string;
};

export default function ProductListComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<Filters>({
    search: searchParams.get("search") || "",
    category: searchParams.get("category") || "",
    brand: searchParams.get("brand") || "",
    status: searchParams.get("status") || "",
    sort: searchParams.get("sort") || "",
  });

  const [products, setProducts] = useState<Product[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);

  /* ------------------------------------
       Fetch Products
    ------------------------------------ */

  const fetchProducts = useCallback(
    async (activeFilters: Filters) => {
      try {
        setLoading(true);

        const params = new URLSearchParams(
          Object.entries(activeFilters).filter(
            ([_, v]) => v !== undefined && v !== null && v !== "",
          ) as any,
        );

        const res = await fetch(`/api/products?${params.toString()}`);
        const data = await res.json();

        setProducts(data.items || []);
      } catch {
        showToast("error", "Failed to load products");
      } finally {
        setLoading(false);
      }
    },
    [showToast],
  );

  // [ADDED] Monitored trigger sequence to mirror programmatic state mutations directly to active URL string
  const handleApplyFilters = (newFilters: Filters) => {
    setFilters(newFilters);

    const params = new URLSearchParams();
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value) params.set(key, value.toString());
    });

    // Pushes state back into window history without hard reloading the full layout wrapper
    router.push(`/platform/products?${params.toString()}`);
  };

  // [UPDATED] Runs on mount and fetches based on parameters loaded out of historical path
  useEffect(() => {
    fetchProducts(filters);
  }, [filters, fetchProducts]);

  const handleExportCsv = () => {
    exportToCsv<Product>(
      "products",
      [
        { title: "Product", dataIndex: "name" },
        { title: "SKU", dataIndex: "sku" },
        { title: "Category", dataIndex: "category" },
        { title: "Brand", dataIndex: "brand" },
        {
          title: "Price",
          dataIndex: "base_price",
          format: (v) => `€${Number(v).toLocaleString()}`,
        },
        {
          title: "Status",
          dataIndex: "status",
          format: (v) => (v ? "Active" : "Inactive"),
        },
      ],
      products,
    );
  };

  /* const fetchProducts = async (filters: Filters = {}) => {
    try {
      setLoading(true);

      const params = new URLSearchParams(
        Object.entries(filters).filter(([_, v]) => v) as any,
      );

      const res = await fetch(`/api/products?${params.toString()}`);
      const data = await res.json();

      setProducts(data.items || []);
    } catch {
      showToast("error", "Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []); */

  /* ------------------------------------
     Delete
  ------------------------------------ */
  const handleDelete = async () => {
    if (!selectedId) return;

    try {
      await fetch(`/api/products?id=${selectedId}`, {
        method: "DELETE",
      });

      setShowDeleteModal(false);
      setSelectedId(null);
      fetchProducts(filters);
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  const columns = [
    {
      title: "Product",
      dataIndex: "name",
      width: 200,
      render: (text: string, record: Product) => (
        <Link
          href={`products/${record.id}`}
          title={text}
          className="block max-w-[180px] truncate text-blue-600 hover:underline"
        >
          {text}
        </Link>
      ),
      sorter: (a: Product, b: Product) => a.name.localeCompare(b.name),
    },
    {
      title: "SKU",
      dataIndex: "sku",
      width: 120,
      sorter: (a: Product, b: Product) => (a.sku || "").localeCompare(b.sku || ""),
    },
    {
      title: "Category",
      dataIndex: "category",
      sorter: (a: Product, b: Product) => a.category.localeCompare(b.category),
    },
    {
      title: "Brand",
      dataIndex: "brand",
      sorter: (a: Product, b: Product) => a.brand.localeCompare(b.brand),
    },
    {
      title: "Price",
      dataIndex: "base_price",
      sorter: (a: Product, b: Product) => a.base_price - b.base_price,
      render: (base_price: number) => `€${base_price.toLocaleString()}`,
    },
    // {
    //   title: "Qty",
    //   dataIndex: "quantity",
    //   sorter: (a: Product, b: Product) => a.quantity - b.quantity,
    // },
    {
      title: "Status",
      dataIndex: "status",
      render: (s: number) => (
        <span
          className={`px-2 py-1 rounded-full text-white text-xs font-semibold ${s ? "bg-green-600" : "bg-red-600"}`}
        >
          {s ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      title: "Action",
      dataIndex: "action",
      render: (_: any, record: Product) => (
        <div className="flex gap-2">
          <Link
            href={`products/${record.id}`}
            className="p-2 hover:text-blue-600"
          >
            <Eye size={16} />
          </Link>
          <Link
            href={`products/${record.id}/edit`}
            className="p-2 hover:text-yellow-600"
          >
            <Edit size={16} />
          </Link>
          <button
            onClick={() => {
              setSelectedId(record.id);
              setShowDeleteModal(true);
            }}
            className="p-2 text-red-500 hover:text-red-700"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="pt-0 page-wrapper">
        <div className="content">
          {/* ------------------------- PAGE HEADER ------------------------- */}
          <div className="page-header flex flex-wrap justify-between items-center gap-3 mb-4">
            <div>
              <h4 className="text-lg font-semibold">Product List</h4>
              <h6 className="text-gray-500">Manage your products</h6>
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
              {/* <div className="search-set"></div> */}
              {/* <FilterBar onApply={fetchProducts} /> */}
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
                <Table columns={columns} dataSource={products} rowKey="id" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------- DELETE MODAL ------------------------- */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full text-center">
            <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mx-auto mb-3">
              <TbTrash size={28} className="text-red-600" />
            </span>
            <h4 className="text-lg font-bold mb-2">Delete Product</h4>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete this product?
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------- IMPORT MODAL ------------------------- */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <ProductImportModal
            onClose={() => setShowImportModal(false)}
            onSuccess={() => {
              fetchProducts(filters); // refresh list after import
              showToast("success", "Products imported successfully");
            }}
          />
        </div>
      )}

      {/* ------------------------- [ADDED] DISCOUNT IMPORT MODAL ------------------------- */}
      {showDiscountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <DiscountImportModal
            onClose={() => setShowDiscountModal(false)}
            onSuccess={() => {
              fetchProducts(filters); // Refresh data to accurately reflect new price schemas
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
