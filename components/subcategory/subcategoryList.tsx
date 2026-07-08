// components/subcategory/subcategoryList.tsx

"use client";

import React, { useEffect, useState, useMemo } from "react";
import Table from "@/core/common/pagination/datatable";
import { Edit, Trash2 } from "react-feather";
import { TbCirclePlus, TbTrash } from "react-icons/tb";
import { Button, useToast } from "@/core/ui";
import SubcategoryFilterBar from "./SubcategoryFilterBar";

type Subcategory = {
  id: string;
  store_id: string;
  category_id: string;
  name: string;
  slug: string;
  status: number;
  created_at: string;
  updated_at: string;
  category?: string;
};

type Category = {
  id: string;
  store_id: string;
  name: string;
  slug: string;
};

const initialForm = {
  id: null as string | null,
  category_id: "",
  name: "",
  status: true,
};

export default function SubcategoryListComponent() {
  const [data, setData] = useState<Subcategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [sortFilter, setSortFilter] = useState("Recently Added");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [formData, setFormData] = useState(initialForm);

  // Hook up your local confirmation switch setup
  const showDeleteModal = !!deleteId; 

  const { showToast } = useToast();

  /* ------------------------------------
      Load Data
  ------------------------------------ */
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/subcategory");
      const json = await res.json();
      setData(json.items || []);
    } catch {
      showToast("error", "Failed to load subcategories");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/category");
      const json = await res.json();
      setCategories(json.items || []);
    } catch {
      showToast("error", "Failed to load categories");
    }
  };

  useEffect(() => {
    fetchData();
    fetchCategories();
  }, []);

  /* ------------------------------------
      Client-side filtering & sorting logic
  ------------------------------------ */
  const filteredSubcategories = useMemo(() => {
    // 1. Run Filters
    let result = data.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.slug && item.slug.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.category && item.category.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus =
        statusFilter === "All Status" ||
        (statusFilter === "Active" && item.status === 1) ||
        (statusFilter === "InActive" && item.status === 0);

      const matchesCategory =
        categoryFilter === "All Categories" || item.category_id === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });

    // 2. Run Sorting
    return [...result].sort((a, b) => {
      if (sortFilter === "Ascending") {
        return a.name.localeCompare(b.name);
      }
      if (sortFilter === "Descending") {
        return b.name.localeCompare(a.name);
      }
      if (sortFilter === "Recently Added") {
        const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return timeB - timeA;
      }
      if (sortFilter === "Last 7 Days" || sortFilter === "Last Month") {
        const targetDays = sortFilter === "Last 7 Days" ? 7 : 30;
        const boundary = Date.now() - targetDays * 24 * 60 * 60 * 1000;
        const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
        
        if (timeA < boundary && timeB < boundary) return 0;
        return timeB - timeA;
      }
      return 0;
    });
  }, [data, searchQuery, statusFilter, sortFilter, categoryFilter]);

  /* ------------------------------------
      Modals
  ------------------------------------ */
  const openAddModal = () => {
    setIsEditMode(false);
    setFormData(initialForm);
    setIsModalOpen(true);
  };

  const openEditModal = (row: Subcategory) => {
    setIsEditMode(true);
    setFormData({
      id: row.id,
      category_id: row.category_id,
      name: row.name,
      status: row.status === 1,
    });
    setIsModalOpen(true);
  };

  /* ------------------------------------
      Submit
  ------------------------------------ */
  const handleSubmit = async () => {
    if (!formData.name || !formData.category_id) {
      showToast("error", "Name and Category are required");
      return;
    }

    setSaving(true);

    const payload = {
      category_id: formData.category_id,
      name: formData.name,
      status: formData.status ? 1 : 0,
    };

    try {
      const res = await fetch("/api/subcategory", {
        method: isEditMode ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isEditMode ? { id: formData.id, ...payload } : payload),
      });

      if (!res.ok) throw new Error();

      showToast(
        "success",
        isEditMode ? "Subcategory updated" : "Subcategory created"
      );

      setIsModalOpen(false);
      fetchData();
    } catch {
      showToast("error", "Failed to save subcategory");
    } finally {
      setSaving(false);
    }
  };

  /* ------------------------------------
      Delete
  ------------------------------------ */
  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      await fetch(`/api/subcategory?id=${deleteId}`, { method: "DELETE" });
      showToast("success", "Subcategory deleted");
      fetchData();
    } catch {
      showToast("error", "Delete failed");
    } finally {
      setDeleteId(null);
    }
  };

  /* ------------------------------------
      Table Columns
  ------------------------------------ */
  const columns = [
    { title: "Category", dataIndex: "category" },
    { title: "Name", dataIndex: "name" },
    {
      title: "Status",
      render: (_: any, r: Subcategory) =>
        r.status === 1 ? (
          <span className="text-green-600 font-medium">Active</span>
        ) : (
          <span className="text-red-600 font-medium">Inactive</span>
        ),
    },
    {
      title: "Action",
      render: (_: any, r: Subcategory) => (
        <div className="flex gap-2">
          <button onClick={() => openEditModal(r)} className="p-1 text-blue-600">
            <Edit size={16} />
          </button>
          <button onClick={() => setDeleteId(r.id)} className="p-1 text-red-600">
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
              <h4 className="text-lg font-semibold">Subcategory List</h4>
              <h6 className="text-gray-500">Manage your subcategory</h6>
            </div>
            <button
              onClick={openAddModal}
              className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium"
            >
              <TbCirclePlus size={18} />
              Add Subcategory
            </button>
          </div>

          <div className="card table-list-card border rounded shadow-sm bg-white">
            {/* Un-commented and setup Filter bar inside header layout */}
            <div className="card-header p-4 border-b flex justify-between items-center">
              <SubcategoryFilterBar
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                sortFilter={sortFilter}
                setSortFilter={setSortFilter}
                categoryFilter={categoryFilter}
                setCategoryFilter={setCategoryFilter}
                categoriesList={categories}
              />
            </div>

            <div className="card-body p-4">
              {loading ? (
                <div className="flex items-center justify-center py-24 space-x-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black" />
                  <p className="text-gray-500 font-medium">Loading...</p>
                </div>
              ) : (
                <Table
                  columns={columns}
                  dataSource={filteredSubcategories} // Fed from calculated useMemo list data
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
                {isEditMode ? "Edit Subcategory" : "Add Subcategory"}
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
                <label className="block text-sm font-medium mb-1">Category:</label>
                <select
                  value={formData.category_id}
                  onChange={(e) =>
                    setFormData({ ...formData, category_id: e.target.value })
                  }
                  disabled={isEditMode}
                  className={`w-full border rounded px-3 py-2 ${
                    isEditMode ? "bg-gray-100 text-gray-500 cursor-not-allowed" : "bg-white"
                  } focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm`}
                >
                  <option value="">Select Category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-3">
                <label className="block text-sm font-medium mb-1">Subcategory:</label>
                <input
                  type="text"
                  placeholder="Subcategory name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <label className="flex items-center gap-2 mt-4 cursor-pointer select-none">
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
                disabled={saving}
                onClick={handleSubmit}
                className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save"}
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
            <h4 className="font-bold mb-2">Delete Subcategory</h4>
            <p className="text-gray-600 text-sm mb-4">
              Are you sure you want to delete this subcategory?
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setDeleteId(null)}
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

import React, { useEffect, useState } from "react";
import Table from "@/core/common/pagination/datatable";
import { Edit, Trash2 } from "react-feather";
import { TbCirclePlus, TbTrash } from "react-icons/tb";
import { Button, useToast } from "@/core/ui";

type Subcategory = {
  id: string;
  store_id: string;
  category_id: string;
  name: string;
  slug: string;
  status: number;
  created_at: string;
  updated_at: string;
  category?: string;
};

type Category = {
  id: string;
  store_id: string;
  name: string;
  slug: string;
};

const initialForm = {
  id: null as string | null,
  category_id: "",
  name: "",
  status: true,
};

export default function SubcategoryListComponent() {
  const [data, setData] = useState<Subcategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [formData, setFormData] = useState(initialForm);

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const { showToast } = useToast();


  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/subcategory");
      const json = await res.json();
      setData(json.items || []);
    } catch {
      showToast("error", "Failed to load subcategories");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/category");
      const json = await res.json();
      setCategories(json.items || []);
    } catch {
      showToast("error", "Failed to load categories");
    }
  };

  useEffect(() => {
    fetchData();
    fetchCategories();
  }, []);


  const openAddModal = () => {
    setIsEditMode(false);
    setFormData(initialForm);
    setIsModalOpen(true);
  };

  const openEditModal = (row: Subcategory) => {
    setIsEditMode(true);
    setFormData({
      id: row.id,
      category_id: row.category_id,
      name: row.name,
      status: row.status === 1,
    });
    setIsModalOpen(true);
  };


  const handleSubmit = async () => {
    if (!formData.name || !formData.category_id) {
      showToast("error", "Name and Category are required");
      return;
    }

    setSaving(true);

    const payload = {
      category_id: formData.category_id,
      name: formData.name,
      status: formData.status ? 1 : 0,
    };

    try {
      const res = await fetch("/api/subcategory", {
        method: isEditMode ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isEditMode ? { id: formData.id, ...payload } : payload),
      });

      if (!res.ok) throw new Error();

      showToast(
        "success",
        isEditMode ? "Subcategory updated" : "Subcategory created"
      );

      setIsModalOpen(false);
      fetchData();
    } catch {
      showToast("error", "Failed to save subcategory");
    } finally {
      setSaving(false);
    }
  };


  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      await fetch(`/api/subcategory?id=${deleteId}`, { method: "DELETE" });
      showToast("success", "Subcategory deleted");
      fetchData();
    } catch {
      showToast("error", "Delete failed");
    } finally {
      setDeleteId(null);
    }
  };


  const columns = [
    { title: "Category", dataIndex: "category" },
    { title: "Name", dataIndex: "name" },
    {
      title: "Status",
      render: (_: any, r: Subcategory) => (r.status === 1 ? "Active" : "Inactive"),
    },
    {
      title: "Action",
      render: (_: any, r: Subcategory) => (
        <div className="flex gap-2">
          <button onClick={() => openEditModal(r)}>
            <Edit size={16} />
          </button>
          <button onClick={() => setDeleteId(r.id)}>
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
              <h4 className="text-lg font-semibold">Subcategory List</h4>
              <h6 className="text-gray-500">Manage your subcategory</h6>
            </div>
            <button
              onClick={openAddModal}
              className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded"
            >
              <TbCirclePlus size={18} />
              Add Subcategory
            </button>
          </div>

          <div className="card table-list-card">


            <div className="card-body">
              {loading ? (
                <div className="flex items-center justify-center py-24 space-x-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black" />
                  <p className="text-gray-500 font-medium">Loading...</p>
                </div>
              ) : (
                <Table
                  columns={columns}
                  dataSource={data}
                  rowKey="id"
                />
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
                {isEditMode ? "Edit Subcategory" : "Add Subcategory"}
              </h4>
              <Button
                className="btn-close float-right"
                onClick={() => setIsModalOpen(false)}
              >X</Button>
            </div>

            <div className="modal-body">


              <div className="mb-3">
                <label className="col-form-label">Category:</label>
                <select
                  value={formData.category_id}
                  onChange={(e) =>
                    setFormData({ ...formData, category_id: e.target.value })
                  }
                  // disabled="{isEditMode}"
                  disabled={isEditMode}
                  className={`w-full border rounded px-3 py-2 mb-3 ${isEditMode ? "bg-soft-dark" : ""}`}
                >
                  <option value="">Select Category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-3">
                <label className="col-form-label">Subcategory:</label>

                <input
                  type="text"
                  placeholder="Subcategory name"
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
                disabled={saving}
                onClick={handleSubmit}
                className="px-4 py-2 bg-blue-600 text-white rounded"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}


      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded p-6 text-center max-w-sm">
            <TbTrash size={32} className="mx-auto text-red-600 mb-2" />
            <h4 className="font-bold mb-2">Delete Subcategory</h4>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete this title?
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setDeleteId(null)}
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