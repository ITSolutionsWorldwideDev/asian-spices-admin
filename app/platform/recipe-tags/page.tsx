// apps/admin/app/platform/recipe-tags/page.tsx

"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useState } from "react";

import Table from "@/core/common/pagination/datatable";

import { Edit, Trash2 } from "react-feather";

import { TbCirclePlus, TbTrash } from "react-icons/tb";

import { Button, useToast } from "@/core/ui";

type RecipeTag = {
  id: string;

  name: string;

  slug: string;

  color: string;

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

const TAG_COLORS = [
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#84cc16",
  "#22c55e",
  "#14b8a6",
  "#06b6d4",
  "#3b82f6",
  "#6366f1",
  "#8b5cf6",
  "#d946ef",
  "#ec4899",
];

export default function RecipeTagsPage() {
  const [tags, setTags] = useState<RecipeTag[]>([]);

  const [loading, setLoading] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);

  const [isEditMode, setIsEditMode] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    id: null as string | null,

    name: "",

    slug: "",

    color: "#ef4444",

    isActive: true,
  });

  /*
   * FETCH TAGS
   */
  const fetchTags = async () => {
    try {
      setLoading(true);

      const url = isEditMode
        ? `/api/recipe-tags/${formData.id}`
        : "/api/recipe-tags";

      const res = await fetch(url);
      // const res = await fetch("/api/recipe-tags");

      const data = await res.json();

      setTags(data.items || []);
    } catch (err) {
      console.error(err);

      showToast("error", "Failed to load recipe tags");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTags();
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
      color: "#ef4444",
      isActive: true,
    });

    setIsModalOpen(true);
  };

  const openEditModal = (tag: RecipeTag) => {
    setIsEditMode(true);

    setFormData({
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
      color: tag.color,
      isActive: tag.is_active,
    });

    setIsModalOpen(true);
  };

  /*
   * SAVE
   */
  const handleSubmit = async () => {
    try {
      if (!formData.name.trim()) {
        showToast("error", "Tag name is required");
        return;
      }

      if (!formData.slug.trim()) {
        showToast("error", "Slug is required");
        return;
      }
      const payload = {
        name: formData.name,
        slug: formData.slug,
        color: formData.color,
        is_active: formData.isActive,
      };

      const url = isEditMode
        ? `/api/recipe-tags/${formData.id}`
        : "/api/recipe-tags";

      const res = await fetch(url, {
        method: isEditMode ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.error || "Failed to save tag");
      }

      showToast("success", isEditMode ? "Tag updated" : "Tag created");

      setIsModalOpen(false);

      fetchTags();
    } catch (err: any) {
      console.error(err);

      showToast("error", err.message || "Failed to save tag");
    }
  };

  /*
   * DELETE
   */
  const handleDelete = async () => {
    if (!selectedId) return;

    try {
      await fetch(`/api/recipe-tags?id=${selectedId}`, {
        method: "DELETE",
      });

      setShowDeleteModal(false);

      setSelectedId(null);

      fetchTags();

      showToast("success", "Tag deleted");
    } catch (err) {
      console.error(err);

      showToast("error", "Delete failed");
    }
  };

  /*
   * TABLE COLUMNS
   */
  const columns = useMemo(
    () => [
      {
        title: "Tag",

        render: (_: any, record: RecipeTag) => (
          <div className="flex items-center gap-3">
            <div
              className="w-4 h-4 rounded-full"
              style={{
                background: record.color,
              }}
            />

            <div>
              <p className="font-semibold">{record.name}</p>

              <p className="text-xs text-gray-500">{record.slug}</p>
            </div>
          </div>
        ),
      },

      {
        title: "Preview",

        render: (_: any, record: RecipeTag) => (
          <span
            className="px-3 py-1 rounded-full text-white text-xs font-medium"
            style={{
              background: record.color,
            }}
          >
            {record.name}
          </span>
        ),
      },

      {
        title: "Recipes",

        render: (_: any, record: RecipeTag) => (
          <span className="font-medium">{record.recipes_count || 0}</span>
        ),
      },

      {
        title: "Status",

        render: (_: any, record: RecipeTag) =>
          record.is_active ? (
            <span className="text-green-600 font-medium">Active</span>
          ) : (
            <span className="text-red-600 font-medium">Inactive</span>
          ),
      },

      {
        title: "Action",

        render: (_: any, record: RecipeTag) => (
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
          <div className="page-header flex justify-between items-center mb-5">
            <div>
              <h4 className="text-lg font-semibold">Recipe Tags</h4>

              <h6 className="text-gray-500">Manage recipe tags</h6>
            </div>

            <button
              onClick={openAddModal}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg"
            >
              <TbCirclePlus size={18} />
              Add Tag
            </button>
          </div>

          <div className="card">
            <div className="card-body">
              {loading ? (
                <div className="flex items-center justify-center py-24 space-x-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black" />
                  <p className="text-gray-500 font-medium">Loading...</p>
                </div>
              ) : (
                <Table columns={columns} dataSource={tags} rowKey="id" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl w-full max-w-xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg">
                {isEditMode ? "Edit Recipe Tag" : "Create Recipe Tag"}
              </h3>

              <Button type="button" onClick={() => setIsModalOpen(false)}>
                X
              </Button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Tag Name
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

              {/* COLOR */}
              <div>
                <label className="block text-sm font-medium mb-3">
                  Tag Color
                </label>

                <div className="flex flex-wrap gap-3">
                  {TAG_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          color,
                        })
                      }
                      className={`w-9 h-9 rounded-full border-4 ${
                        formData.color === color
                          ? "border-black"
                          : "border-transparent"
                      }`}
                      style={{
                        background: color,
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* PREVIEW */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Preview
                </label>

                <span
                  className="px-4 py-2 rounded-full text-white font-medium inline-flex"
                  style={{
                    background: formData.color,
                  }}
                >
                  {formData.name || "Recipe Tag"}
                </span>
              </div>

              <div>
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

            <div className="flex justify-end gap-3 mt-8">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-gray-100 rounded-lg"
              >
                Cancel
              </button>

              <button
                onClick={handleSubmit}
                className="px-5 py-2 bg-blue-600 text-white rounded-lg"
              >
                Save Tag
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full text-center">
            <TbTrash size={32} className="mx-auto text-red-600 mb-3" />

            <h4 className="font-bold mb-2">Delete Recipe Tag</h4>

            <p className="text-gray-500 mb-6">
              Are you sure you want to delete this tag?
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
