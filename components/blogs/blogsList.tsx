// components/blogs/blogsList.tsx
"use client";

import { useEffect, useState } from "react";
import { TbCirclePlus, TbTrash } from "react-icons/tb";
import FilterBar from "./FilterBar";
import { useToast } from "@/core/ui";
import Link from "next/link";
import BlogCard from "./BlogCard";

/* ------------------------------------
   Types
------------------------------------ */
type Blog = {
  blog_id: number;
  title: string;
  slug: string;
  excerpt: string;
  status: "draft" | "published";
  featured_image_url?: string;
  created_at: string;
  author_name?: string;
};

export default function BlogsListComponent() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [selectedId, setSelectedId] = useState<number | null>(null);

  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    blog_id: null as number | null,
    name: "",
    status: true,
  });

  /* ------------------------------------
     Fetch Blogs
  ------------------------------------ */
  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/blogs");
      const data = await res.json();
      setBlogs(data.items || []);
    } catch (err) {
      console.error("Failed to load blogs", err);
      showToast("error", "Failed to load blogs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  /* ------------------------------------
     Delete
  ------------------------------------ */
  const handleDelete = async () => {
    if (!selectedId) return;

    try {
      await fetch(`/api/blogs?id=${selectedId}`, {
        method: "DELETE",
      });

      setShowDeleteModal(false);
      setSelectedId(null);
      fetchBlogs();
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  /* ------------------------------------
     Render
  ------------------------------------ */
  return (
    <>
      <div className="page-wrapper2">
        <div className="content">
          <div className="page-header flex justify-between items-center mb-4">
            <div>
              <h4 className="text-lg font-semibold">Blog List</h4>
              <h6 className="text-gray-500">Manage your blogs</h6>
            </div>
            <Link
              href="/blogs/create"
              className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded  hover:bg-blue-700"
            >
              <TbCirclePlus size={18} />
              Add Blog
            </Link>
          </div>
          <div className="card">
            <div className="card-header flex justify-between items-center">
              <FilterBar />
            </div>
            <div className="card-body p-3"></div>
          </div>

          {loading ? (
            <div className="card">
              <div className="card-body p-3">
                <div className="flex items-center justify-center py-24 space-x-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black" />
                  <p className="text-gray-500 font-medium">Loading...</p>
                </div>
              </div>
            </div>
          ) : blogs.length === 0 ? (
            <div className="card">
              <div className="card-body p-3">
                <p className="text-center py-10 text-gray-500">
                  No blogs found
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {blogs.map((blog) => (
                <BlogCard
                  key={blog.blog_id}
                  blog={blog}
                  onDelete={(id) => {
                    setSelectedId(id);
                    setShowDeleteModal(true);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* DELETE MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded p-6 text-center max-w-sm">
            <TbTrash size={32} className="mx-auto text-red-600 mb-2" />
            <h4 className="font-bold mb-2">Delete Blog</h4>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete this blog?
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
