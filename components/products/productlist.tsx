// apps/admin/components/products/productlist.tsx
"use client";

import { useEffect, useState } from "react";
import Table from "@/core/common/pagination/datatable";
import Link from "next/link";
import { Download, Edit, Eye, Trash2 } from "react-feather";
import { TbCirclePlus, TbTrash } from "react-icons/tb";
import FilterBar from "./FilterBar";
import { useToast } from "@/core/ui";
import ProductImportModal from "./ProductImportModal";

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
  price: number;
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
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  /* ------------------------------------
       Fetch Products
    ------------------------------------ */

  const fetchProducts = async (filters: Filters = {}) => {
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
  }, []);

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
      fetchProducts();
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  const columns = [
    // {
    //   title: "SKU",
    //   dataIndex: "sku",
    //   sorter: (a: Product, b: Product) => a.sku.localeCompare(b.sku),
    // },
    {
      title: "Product",
      dataIndex: "name",
      render: (text: string, record: Product) => (
        <Link
          href={`products/${record.id}`}
          className="text-blue-600 hover:underline"
        >
          {text}
        </Link>
      ),
      sorter: (a: Product, b: Product) => a.name.localeCompare(b.name),
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
      dataIndex: "price",
      sorter: (a: Product, b: Product) => a.price - b.price,
      render: (price: number) => `€${price.toLocaleString()}`,
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
            </div>
          </div>

          {/* ------------------------- FILTER BAR ------------------------- */}
          <div className="card table-list-card mb-4">
            <div className="card-header flex flex-wrap justify-between items-center gap-3">
              {/* <div className="search-set"></div> */}
              <FilterBar onApply={fetchProducts} />
            </div>
            {/* ------------------------- TABLE ------------------------- */}
            <div className="card-body">
              <div className="overflow-x-auto">
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
              fetchProducts(); // refresh list after import
              showToast("success", "Products imported successfully");
            }}
          />
        </div>
      )}
    </>
  );
}

/* const columns = [
    {
      title: "SKU",
      dataIndex: "sku",
      sorter: (a: any, b: any) => a.sku.localeCompare(b.sku),
    },
    {
      title: "Product",
      dataIndex: "name",
      render: (text: string, record: any) => (
        <div className="flex items-center">
          <Link href="#" className="avatar avatar-md mr-2">
            <img src={record.productImage} alt="product" />
          </Link>
          <Link href={`products/${record.id}`}>{text}</Link>
        </div>
      ),
      sorter: (a: any, b: any) => a.product.localeCompare(b.product),
    },
    {
      title: "Category",
      dataIndex: "category",
      sorter: (a: any, b: any) => a.category.localeCompare(b.category),
    },
    {
      title: "Brand",
      dataIndex: "brand",
      sorter: (a: any, b: any) => a.brand.localeCompare(b.brand),
    },
    {
      title: "Price",
      dataIndex: "price",
      sorter: (a: any, b: any) => a.price - b.price,
    },
    {
      title: "Qty",
      dataIndex: "quantity",
      sorter: (a: any, b: any) => a.quantity - b.quantity,
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (s: number) => (
        <span className={`badge ${s ? "badge-success" : "badge-danger"}`}>
          {s ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      title: "Action",
      dataIndex: "action",
      render: (text: any, record: any) => (
        <div className="flex gap-2">
          <Link href={`products/${record.id}`} className="p-2">
            <Eye size={16} />
          </Link>
          <Link href={`products/${record.id}/edit`} className="p-2">
            <Edit size={16} />
          </Link>
          <button
            onClick={() => {
              setSelectedId(record.category_id);
              setShowDeleteModal(true);
            }}
            className="p-2 text-red-500 hover:text-red-700"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ]; */

{
  /* <div className="bg-white rounded-lg p-6 max-w-lg w-full">
            <h4 className="text-lg font-bold mb-4">Import Products</h4>
            <p className="text-gray-600 mb-4">Upload CSV or Excel file to import products.</p>
            <input type="file" className="w-full border rounded p-2 mb-4" />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Import
              </button>
            </div>
          </div> */
}
