// components/brand/brandList.tsx
"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";
import Table from "@/core/common/pagination/datatable";
import { Edit, Trash2 } from "react-feather";
import { TbCirclePlus, TbTrash } from "react-icons/tb";
import FilterBar from "./FilterBar";
import { Button, useToast } from "@/core/ui";

/* ------------------------------------
   Types
------------------------------------ */
type Brand = {
  brand_id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  status: boolean;
  created_at: string;
  updated_at: string;
};

export default function BrandListComponent() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    brand_id: null as string | null,
    name: "",
    description: "",
    logo_url: "",
    status: true,
  });

  /* ------------------------------------
     Fetch Brands
  ------------------------------------ */
  const fetchBrands = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/brand");
      const data = await res.json();
      setBrands(data.items || []);
    } catch (err) {
      console.error("Failed to load brands", err);
      showToast("error", "Failed to load brands");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  /* ------------------------------------
     Modals
  ------------------------------------ */
  const openAddModal = () => {
    setIsEditMode(false);
    setFormData({
      brand_id: null,
      name: "",
      description: "",
      logo_url: "",
      status: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (record: Brand) => {
    setIsEditMode(true);
    setFormData({
      brand_id: record.brand_id,
      name: record.name,
      description: record.description || "",
      logo_url: record.logo_url || "",
      status: record.status,
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
        description: formData.description,
        logo_url: formData.logo_url,
        status: formData.status,
      };

      const res = await fetch("/api/brand", {
        method: isEditMode ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isEditMode ? { brand_id: formData.brand_id, ...payload } : payload,
        ),
      });

      if (!res.ok) throw new Error();

      showToast("success", isEditMode ? "Brand updated" : "Brand created");

      setIsModalOpen(false);
      fetchBrands();
    } catch (err) {
      showToast("error", "Failed to save Brand");
      console.error("Save failed", err);
    }
  };

  /* ------------------------------------
     Delete
  ------------------------------------ */
  const handleDelete = async () => {
    if (!selectedId) return;

    try {
      await fetch(`/api/brand?id=${selectedId}`, {
        method: "DELETE",
      });

      setShowDeleteModal(false);
      setSelectedId(null);
      fetchBrands();
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  /* ------------------------------------
     Table Columns
  ------------------------------------ */
  const columns = [
    {
      title: "Brand",
      dataIndex: "name",
    },
    {
      title: "Status",
      render: (_: any, record: Brand) =>
        record.status ? (
          <span className="text-green-600 font-medium">Active</span>
        ) : (
          <span className="text-red-600 font-medium">Inactive</span>
        ),
    },
    {
      title: "Action",
      render: (_: any, record: Brand) => (
        <div className="flex gap-2">
          <button
            onClick={() => openEditModal(record)}
            className="p-2 text-blue-600"
          >
            <Edit size={16} />
          </button>
          <button
            onClick={() => {
              setSelectedId(record.brand_id);
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
              <h4 className="text-lg font-semibold">Brand List</h4>
              <h6 className="text-gray-500">Manage your brands</h6>
            </div>
            <button
              onClick={openAddModal}
              className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded"
            >
              <TbCirclePlus size={18} />
              Add Brand
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
                <Table
                  columns={columns}
                  dataSource={brands}
                  rowKey="brand_id"
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ADD / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 modal fade">
          <div className="modal-content modal-content-demo bg-white rounded w-full max-w-lg">
            <div className="modal-header flex">
              <h4 className="modal-title">
                {isEditMode ? "Edit Brand" : "Add Brand"}
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
                  placeholder="Brand name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full border rounded px-3 py-2 mb-4"
                />
              </div>

              <textarea
                placeholder="Description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full border rounded px-3 py-2 mb-3"
              />

              <input
                type="text"
                placeholder="Logo URL"
                value={formData.logo_url}
                onChange={(e) =>
                  setFormData({ ...formData, logo_url: e.target.value })
                }
                className="w-full border rounded px-3 py-2 mb-3"
              />

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

      {/* DELETE MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded p-6 text-center max-w-sm">
            <TbTrash size={32} className="mx-auto text-red-600 mb-2" />
            <h4 className="font-bold mb-2">Delete Brand</h4>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete this brand?
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
}
