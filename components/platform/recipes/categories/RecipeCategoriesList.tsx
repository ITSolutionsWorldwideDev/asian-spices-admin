// components/platform/recipes/categories/RecipeCategoriesList.tsx

"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useState } from "react";

import Table from "@/core/common/pagination/datatable";

import { Edit, Trash2 } from "react-feather";

import { TbCirclePlus, TbTrash } from "react-icons/tb";

import FiltersBar from "./FiltersBar";

import { Button, useToast } from "@/core/ui";

type RecipeCategory = {
  id: string;

  name: string;

  slug: string;

  description?: string;

  image_url?: string;

  sort_order: number;

  is_active: boolean;

  recipes_count?: number;
};

function generateSlug(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-");
}

export default function RecipeCategoriesList() {
  const [categories, setCategories] = useState<RecipeCategory[]>([]);

  const [loading, setLoading] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);

  const [isEditMode, setIsEditMode] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);

  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    id: null as string | null,

    name: "",

    slug: "",

    description: "",

    imageUrl: "",

    sortOrder: 0,

    isActive: true,
  });

  /*
   * FETCH
   */
  const fetchCategories = async () => {
    try {
      setLoading(true);

      const res = await fetch(`/api/recipe-categories`);

      const data = await res.json();

      setCategories(data.items || []);
    } catch (err) {
      console.error(err);

      showToast("error", "Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  /*
   * MODALS
   */
  const openAddModal = () => {
    setIsEditMode(false);

    setFormData({
      id: null,
      name: "",
      slug: "",
      description: "",
      imageUrl: "",
      sortOrder: 0,
      isActive: true,
    });

    setIsModalOpen(true);
  };

  const openEditModal = (record: RecipeCategory) => {
    setIsEditMode(true);

    setFormData({
      id: record.id,
      name: record.name,
      slug: record.slug,
      description: record.description || "",
      imageUrl: record.image_url || "",
      sortOrder: record.sort_order || 0,
      isActive: record.is_active,
    });

    setIsModalOpen(true);
  };

  /*
   * SAVE
   */
  const handleSubmit = async () => {
    try {
      setSaving(true);
      const payload = {
        name: formData.name,

        slug: formData.slug,

        description: formData.description,

        image_url: formData.imageUrl,

        sort_order: formData.sortOrder,

        is_active: formData.isActive,
      };

      let res;

      if (isEditMode) {
        res = await fetch(`/api/recipe-categories/${formData.id}`, {
          //   method: isEditMode ? "PUT" : "POST",
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(
            isEditMode ? { id: formData.id, ...payload } : payload,
          ),
        });
      } else {
        res = await fetch("/api/recipe-categories", {
          //   method: isEditMode ? "PUT" : "POST",
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json(); // ✅ IMPORTANT: always read response

      if (!res.ok) {
        // 🔥 show real backend error
        throw new Error(data?.error || "Failed to save category");
      }

      showToast(
        "success",
        data?.message || (isEditMode ? "Category updated" : "Category created"),
      );

      setIsModalOpen(false);
      fetchCategories();
    } catch (err) {
      console.error(err);
      setSaving(false);

      showToast("error", "Failed to save category");
    }
  };

  /*
   * DELETE
   */
  const handleDelete = async () => {
    if (!selectedId) return;

    try {
      await fetch(`/api/recipe-categories/${selectedId}`, {
        method: "DELETE",
      });

      setShowDeleteModal(false);

      setSelectedId(null);

      fetchCategories();

      showToast("success", "Category deleted");
    } catch (err) {
      console.error(err);

      showToast("error", "Delete failed");
    }
  };

  /*
   * COLUMNS
   */
  const columns = useMemo(
    () => [
      {
        title: "Category",

        render: (_: any, record: RecipeCategory) => (
          <div className="flex items-center gap-3">
            <img
              src={record.image_url || "/placeholder.png"}
              alt={record.name}
              className="w-12 h-12 rounded-lg object-cover border"
            />

            <div>
              <p className="font-semibold">{record.name}</p>

              <p className="text-xs text-gray-500">{record.slug}</p>
            </div>
          </div>
        ),
      },

      {
        title: "Recipes",

        render: (_: any, record: RecipeCategory) => (
          <span className="font-medium">{record.recipes_count || 0}</span>
        ),
      },

      {
        title: "Sort Order",

        dataIndex: "sort_order",
      },

      {
        title: "Status",

        render: (_: any, record: RecipeCategory) =>
          record.is_active ? (
            <span className="text-green-600 font-medium">Active</span>
          ) : (
            <span className="text-red-600 font-medium">Inactive</span>
          ),
      },

      {
        title: "Action",

        render: (_: any, record: RecipeCategory) => (
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
    ],
    [],
  );

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          <div className="page-header flex justify-between items-center mb-4">
            <div>
              <h4 className="text-lg font-semibold">Recipe Categories</h4>

              <h6 className="text-gray-500">Manage recipe categories</h6>
            </div>

            <button
              onClick={openAddModal}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded"
            >
              <TbCirclePlus size={18} />
              Add Category
            </button>
          </div>

          <div className="card table-list-card">
            <div className="card-header">
              <FiltersBar />
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

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl w-full max-w-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg">
                {isEditMode ? "Edit Recipe Category" : "Create Recipe Category"}
              </h3>

              <Button onClick={() => setIsModalOpen(false)}>X</Button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Category Name
                </label>

                <input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      name: e.target.value,
                      slug: generateSlug(e.target.value),
                    })
                  }
                  className="w-full border rounded-lg px-4 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Slug</label>

                <input
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      slug: generateSlug(e.target.value),
                    })
                  }
                  className="w-full border rounded-lg px-4 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Description
                </label>

                <textarea
                  rows={4}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      description: e.target.value,
                    })
                  }
                  className="w-full border rounded-lg px-4 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Image URL
                </label>

                <input
                  value={formData.imageUrl}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      imageUrl: e.target.value,
                    })
                  }
                  className="w-full border rounded-lg px-4 py-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Sort Order
                  </label>

                  <input
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        sortOrder: Number(e.target.value),
                      })
                    }
                    className="w-full border rounded-lg px-4 py-2"
                  />
                </div>

                <div className="flex items-end">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          isActive: e.target.checked,
                        })
                      }
                    />
                    Active
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-gray-100 rounded-lg"
              >
                Cancel
              </button>

              <button
                onClick={handleSubmit}
                disabled={saving}
                className="px-5 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Category"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full text-center">
            <TbTrash size={32} className="mx-auto text-red-600 mb-3" />

            <h4 className="font-bold mb-2">Delete Category</h4>

            <p className="text-gray-500 mb-6">
              Are you sure you want to delete this recipe category?
            </p>

            <div className="flex justify-center gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 bg-gray-100 rounded-lg"
              >
                Cancel
              </button>

              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg"
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
