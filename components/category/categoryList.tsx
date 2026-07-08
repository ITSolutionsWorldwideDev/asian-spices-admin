// components/category/categoryList.tsx

"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useState, useMemo } from "react";
import Table from "@/core/common/pagination/datatable";
import { Edit, Trash2 } from "react-feather";
import { TbCirclePlus, TbTrash } from "react-icons/tb";
import FilterBar from "./FilterBar";
import { Button, useToast } from "@/core/ui";

/* ------------------------------------
   Types
------------------------------------ */
type Category = {
  id: string;
  name: string;
  slug: string;
  status: number;
  created_at?: string;
  updated_at?: string;
};

export default function CategoryListComponent() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  // Filter States

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [sortFilter, setSortFilter] = useState("Recently Added");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    id: null as string | null,
    name: "",
    status: true,
  });

  /* ------------------------------------
      Fetch Categories
  ------------------------------------ */
  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/category");
      const data = await res.json();
      setCategories(data.items || []);
    } catch (err) {
      console.error("Failed to load categories", err);
      showToast("error", "Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  /* ------------------------------------
      Client-side filtering logic
  ------------------------------------ */
  const filteredCategories = useMemo(() => {
    // 1. Filter Logic
    let result = categories.filter((category) => {
      const matchesSearch =
        category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        category.slug.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "All Status" ||
        (statusFilter === "Active" && category.status === 1) ||
        (statusFilter === "InActive" && category.status === 0);

      return matchesSearch && matchesStatus;
    });

    // 2. Sort Logic
    return [...result].sort((a, b) => {
      if (sortFilter === "Ascending") {
        return a.name.localeCompare(b.name);
      }
      if (sortFilter === "Descending") {
        return b.name.localeCompare(a.name);
      }
      if (sortFilter === "Recently Added") {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA; // Newest first
      }
      if (sortFilter === "Last 7 Days" || sortFilter === "Last Month") {
        const days = sortFilter === "Last 7 Days" ? 7 : 30;
        const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;

        // Keep only items within time limit, then sort descending
        if (dateA < cutoff && dateB < cutoff) return 0;
        return dateB - dateA;
      }
      return 0;
    });
  }, [categories, searchQuery, statusFilter, sortFilter]);

  /* ------------------------------------
      Modals
  ------------------------------------ */
  const openAddModal = () => {
    setIsEditMode(false);
    setFormData({
      id: null,
      name: "",
      status: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (record: Category) => {
    setIsEditMode(true);
    setFormData({
      id: record.id,
      name: record.name,
      status: record.status === 1,
    });
    setIsModalOpen(true);
  };

  /* ------------------------------------
      Create / Update
  ------------------------------------ */
  const handleSubmit = async () => {
    try {
      const payload = {
        name: formData.name,
        status: formData.status ? 1 : 0,
      };

      const res = await fetch("/api/category", {
        method: isEditMode ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isEditMode ? { id: formData.id, ...payload } : payload,
        ),
      });

      if (!res.ok) throw new Error();

      showToast(
        "success",
        isEditMode ? "Category updated" : "Category created",
      );

      setIsModalOpen(false);
      fetchCategories();
    } catch (err) {
      console.error("Save failed", err);
      showToast("error", "Failed to save Category");
    }
  };

  /* ------------------------------------
      Delete
  ------------------------------------ */
  const handleDelete = async () => {
    if (!selectedId) return;

    try {
      await fetch(`/api/category?id=${selectedId}`, {
        method: "DELETE",
      });

      setShowDeleteModal(false);
      setSelectedId(null);
      fetchCategories();
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  /* ------------------------------------
      Table Columns
  ------------------------------------ */
  const columns = [
    {
      title: "Category",
      dataIndex: "name",
    },
    {
      title: "Slug",
      dataIndex: "slug",
    },
    {
      title: "Status",
      render: (_: any, record: Category) =>
        record.status === 1 ? (
          <span className="text-green-600 font-medium">Active</span>
        ) : (
          <span className="text-red-600 font-medium">Inactive</span>
        ),
    },
    {
      title: "Action",
      render: (_: any, record: Category) => (
        <div className="flex gap-2">
          <button
            onClick={() => openEditModal(record)}
            className="p-2 text-blue-600"
          >
            <Edit size={16} />
          </button>
          <button
            onClick={() => {
              setSelectedId(record.id);
              setShowDeleteModal(true);
            }}
            className="p-2 text-red-600"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  /* ------------------------------------
      Render
  ------------------------------------ */
  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          <div className="page-header flex justify-between items-center mb-4">
            <div>
              <h4 className="text-lg font-semibold">Category List</h4>
              <h6 className="text-gray-500">Manage your categories</h6>
            </div>
            <button
              onClick={openAddModal}
              className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded"
            >
              <TbCirclePlus size={18} />
              Add Category
            </button>
          </div>

          <div className="card table-list-card border rounded shadow-sm bg-white">
            <div className="card-header p-4 border-b flex justify-between items-center">
              <FilterBar
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                sortFilter={sortFilter}
                setSortFilter={setSortFilter}
              />
            </div>

            <div className="card-body p-4">
              {loading ? (
                <div className="flex items-center justify-center py-24 space-x-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black" />
                  <p className="text-gray-500 font-medium">Loading...</p>
                </div>
              ) : (
                /* Swapped raw categories out for dynamically computed filteredCategories */
                <Table
                  columns={columns}
                  dataSource={filteredCategories}
                  rowKey="id"
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ADD / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 modal fade">
          <div className="modal-content modal-content-demo bg-white rounded w-full max-w-lg shadow-lg">
            <div className="modal-header p-4 border-b flex justify-between items-center">
              <h4 className="modal-title font-semibold">
                {isEditMode ? "Edit Category" : "Add Category"}
              </h4>
              <Button
                className="btn-close text-gray-500 hover:text-black"
                onClick={() => setIsModalOpen(false)}
              >
                X
              </Button>
            </div>
            <div className="modal-body p-4">
              <div className="mb-3">
                <label className="block text-sm font-medium mb-1">
                  Category Name:
                </label>
                <input
                  type="text"
                  placeholder="Category name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <label className="flex items-center gap-2 mt-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.checked })
                  }
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium">Active</span>
              </label>
            </div>

            <div className="modal-footer p-4 border-t flex justify-end gap-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-gray-200 rounded text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded p-6 text-center max-w-sm shadow-lg">
            <TbTrash size={32} className="mx-auto text-red-600 mb-2" />
            <h4 className="font-bold mb-2">Delete Category</h4>
            <p className="text-gray-600 text-sm mb-4">
              Are you sure you want to delete this category?
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 bg-gray-200 rounded text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded text-sm font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
/* "use client";

import { useEffect, useState } from "react";
import Table from "@/core/common/pagination/datatable";
import { Edit, Trash2 } from "react-feather";
import { TbCirclePlus, TbTrash } from "react-icons/tb";
import FilterBar from "./FilterBar";
import { Button, useToast } from "@/core/ui";


type Category = {
  id: string;
  name: string;
  slug: string;
  status: number;
  created_at?: string;
  updated_at?: string;
};

export default function CategoryListComponent() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    id: null as string | null,
    name: "",
    status: true,
  });

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/category");
      const data = await res.json();
      setCategories(data.items || []);
    } catch (err) {
      console.error("Failed to load categories", err);
      showToast("error", "Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);


  const openAddModal = () => {
    setIsEditMode(false);
    setFormData({
      id: null,
      name: "",
      status: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (record: Category) => {
    setIsEditMode(true);
    setFormData({
      id: record.id,
      name: record.name,
      status: record.status === 1,
    });
    setIsModalOpen(true);
  };


  const handleSubmit = async () => {
    try {
      const payload = {
        name: formData.name,
        status: formData.status ? 1 : 0,
      };

      const res = await fetch("/api/category", {
        method: isEditMode ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isEditMode ? { id: formData.id, ...payload } : payload,
        ),
      });

      if (!res.ok) throw new Error();

      showToast(
        "success",
        isEditMode ? "Category updated" : "Category created",
      );

      setIsModalOpen(false);
      fetchCategories();
    } catch (err) {
      console.error("Save failed", err);
      showToast("error", "Failed to save Category");
    }
  };


  const handleDelete = async () => {
    if (!selectedId) return;

    try {
      await fetch(`/api/category?id=${selectedId}`, {
        method: "DELETE",
      });

      setShowDeleteModal(false);
      setSelectedId(null);
      fetchCategories();
    } catch (err) {
      console.error("Delete failed", err);
    }
  };


  const columns = [
    {
      title: "Category",
      dataIndex: "name",
    },
    {
      title: "Slug",
      dataIndex: "slug",
    },
    {
      title: "Status",
      render: (_: any, record: Category) =>
        record.status === 1 ? (
          <span className="text-green-600 font-medium">Active</span>
        ) : (
          <span className="text-red-600 font-medium">Inactive</span>
        ),
    },
    {
      title: "Action",
      render: (_: any, record: Category) => (
        <div className="flex gap-2">
          <button
            onClick={() => openEditModal(record)}
            className="p-2 text-blue-600"
          >
            <Edit size={16} />
          </button>
          <button
            onClick={() => {
              setSelectedId(record.id);
              setShowDeleteModal(true);
            }}
            className="p-2 text-red-600"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];


  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          <div className="page-header flex justify-between items-center mb-4">
            <div>
              <h4 className="text-lg font-semibold">Category List</h4>
              <h6 className="text-gray-500">Manage your categories</h6>
            </div>
            <button
              onClick={openAddModal}
              className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded"
            >
              <TbCirclePlus size={18} />
              Add Category
            </button>
          </div>

          <div className="card table-list-card">
            <div className="card-header flex justify-between items-center">
              <FilterBar />
            </div>

            <div className="card-body">
              {loading ? (
                <div className="flex items-center justify-center py-24 space-x-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black" />
                  <p className="text-gray-500 font-medium">Loading...</p>
                </div>
              ) : (
                <Table columns={columns} dataSource={categories} rowKey="id" />
              )}
            </div>
          </div>
        </div>
      </div>


      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 modal fade">
          <div className="modal-content modal-content-demo bg-white rounded w-full max-w-lg">
            <div className="modal-header flex">
              <h4 className="modal-title">
                {isEditMode ? "Edit Category" : "Add Category"}
              </h4>
              <Button
                className="btn-close float-right"
                onClick={() => setIsModalOpen(false)}
              >
                X
              </Button>
            </div>
            <div className="modal-body">
              <div className="mb-3">
                <label className="col-form-label">Brand:</label>

                <input
                  type="text"
                  placeholder="Category name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full border rounded px-3 py-2 mb-4"
                />
              </div>

              <label className="flex items-center gap-2 mb-4">
                <input
                  type="checkbox"
                  checked={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.checked })
                  }
                />
                Active
              </label>
            </div>

            <div className="modal-footer flex justify-end gap-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-gray-200 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-blue-600 text-white rounded"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}


      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded p-6 text-center max-w-sm">
            <TbTrash size={32} className="mx-auto text-red-600 mb-2" />
            <h4 className="font-bold mb-2">Delete Category</h4>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete this category?
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 bg-gray-200 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
} */
