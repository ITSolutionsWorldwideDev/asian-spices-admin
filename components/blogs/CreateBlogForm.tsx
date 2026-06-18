// components/blogs/CreateBlogForm.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
// import { slugify } from "@/lib/slugify";
import { Button, useToast } from "@/core/ui";
import TextEditorNew from "@/core/common/texteditor/texteditor";
import FeaturedImageUpload from "@/components/media/FeaturedImageUpload";
import { memo } from "react";
import Link from "next/link";

const MemoTextEditor = memo(TextEditorNew);

export function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export default function CreateBlogForm() {
  const router = useRouter();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    status: "draft",
    featured_image_id: null as number | null,
    featured_image_url: "",
    meta_title: "",
    meta_description: "",
  });

  //   const [formData, setFormData] = useState({
  //     title: "",
  //     slug: "",
  //     excerpt: "",
  //     content: "",
  //     status: "draft",
  //     featured_image_id: null as number | null,
  //   });

  const handleSubmit = async (status: "draft" | "published") => {
    if (!formData.title || !formData.content) {
      showToast("error", "Title and content are required");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("/api/blogs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          status,
          slug: slugify(formData.title),
        }),
      });

      if (!res.ok) throw new Error("Failed");

      showToast("success", "Blog created");
      router.push("/blogs");
    } catch {
      showToast("error", "Failed to create blog");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper2 p-4 mb-10">
      <div className="content max-w-6xl mx-auto">
        <div className="flex flex-wrap justify-between items-center mb-6">
          <div>
            <h4 className="text-2xl font-semibold">Create Blog</h4>
          </div>
        </div>

        <form
          className="space-y-6"
          onSubmit={(e) => {
            e.preventDefault();
          }}
        >
          {/* handleSubmit(); */}
          <div className="border rounded shadow-sm mb-2">
            <div className="p-4 border-t space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 font-medium">Title</label>
                  <input
                    className="w-full border rounded px-3 py-2"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        title: e.target.value,
                        slug: slugify(e.target.value),
                      }))
                    }
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Slug: {formData.slug}
                  </p>
                </div>

                <div>
                  <label className="block mb-1 font-medium">Status</label>
                  <select
                    className="border rounded px-3 py-2"
                    value={formData.status}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, status: e.target.value }))
                    }
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-1 font-medium">Meta Title</label>
                  <input
                    className="w-full border rounded px-3 py-2"
                    value={formData.meta_title}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, meta_title: e.target.value }))
                    }
                  />
                </div>

                <div>
                  <label className="block mb-1 font-medium">
                    Meta Description
                  </label>
                  <textarea
                    className="w-full border rounded px-3 py-2"
                    rows={3}
                    value={formData.meta_description}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        meta_description: e.target.value,
                      }))
                    }
                  />
                </div>

                <div>
                  <label className="block mb-1 font-medium">
                    Featured Image
                  </label>

                  {formData.featured_image_url && (
                    <img
                      src={formData.featured_image_url}
                      className="h-40 rounded mb-2 object-cover"
                      alt="Featured"
                    />
                  )}

                  <FeaturedImageUpload
                    onUpload={(id, url) =>
                      setFormData((p) => ({
                        ...p,
                        featured_image_id: id,
                        featured_image_url: url,
                      }))
                    }
                  />
                </div>

                <div>
                  <label className="block mb-1 font-medium">Excerpt</label>
                  <textarea
                    className="w-full border rounded px-3 py-2"
                    rows={3}
                    value={formData.excerpt}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, excerpt: e.target.value }))
                    }
                  />
                </div>

                {/* ✅ REUSED TEXT EDITOR */}
                <div>
                  <label className="block mb-1 font-medium">Content</label>
                  <MemoTextEditor
                    value={formData.content}
                    onChange={(val: string) =>
                      setFormData((p) => ({ ...p, content: val }))
                    }
                  />
                </div>

                {/* <Button onClick={handleSubmit}>Create Blog</Button> */}
                {/* loading={loading}  */}
              </div>

              <div className="flex justify-end gap-3">
                <Link href="/products" className="btn btn-secondary">
                  Cancel
                </Link>

                {/* <button className="bg-blue-600 text-white px-6 py-2 rounded">
                    Create Blog
                  </button> */}

                <div className="flex gap-3">
                  <Button
                    variant="secondary"
                    onClick={() => handleSubmit("draft")}
                  >
                    Save Draft
                  </Button>

                  <Button onClick={() => handleSubmit("published")}>
                    Publish
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
