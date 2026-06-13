// apps/admin/components/blogs/EditBlogForm.tsx
"use client";

import { useEffect, useState, memo } from "react";
import { useRouter } from "next/navigation";
import { Button, useToast } from "@/core/ui";
import TextEditorNew from "@/core/common/texteditor/texteditor";
import FeaturedImageUpload from "@/components/media/FeaturedImageUpload";

const MemoTextEditor = memo(TextEditorNew);
import Link from "next/link";

export function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function EditBlogClient({ blogId }: { blogId: string }) {
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

  useEffect(() => {
    if (!blogId || Number.isNaN(blogId)) return;

    fetch(`/api/blogs?id=${blogId}`)
      .then((res) => res.json())
      .then((data) => {
        setFormData({
          title: data.title ?? "",
          slug: data.slug ?? "",
          excerpt: data.excerpt ?? "",
          content: data.content ?? "",
          status: data.status ?? "draft",
          featured_image_id: data.featured_image_id ?? null,
          featured_image_url: data.featured_image_url ?? "",
          meta_title: data.meta_title ?? "",
          meta_description: data.meta_description ?? "",
        });
      })
      .catch(() => showToast("error", "Failed to load blog"));
  }, [blogId]);

  const handleUpdate = async () => {
    try {
      setLoading(true);
      await fetch(`/api/blogs?id=${blogId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          slug: slugify(formData.title),
        }),
      });
      showToast("success", "Blog updated");
      router.push("/blogs");
    } catch {
      showToast("error", "Update failed");
    } finally {
      setLoading(false);
    }
  };

  if (!formData) return <p>Loading...</p>;

  return (
    <div className="page-wrapper2 p-4 mb-10">
      <div className="content max-w-6xl mx-auto">
        <div className="flex flex-wrap justify-between items-center mb-6">
          <div>
            <h4 className="text-2xl font-semibold">Edit Blog</h4>
          </div>
        </div>

        <div className="border rounded shadow-sm space-y-6 mb-2">
          <div className="p-4 border-t space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 font-medium">Title</label>
                <input
                  className="w-full border rounded px-3 py-2"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((p: any) => ({
                      ...p,
                      title: e.target.value,
                      slug: slugify(e.target.value),
                    }))
                  }
                />
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
                <label className="block mb-1 font-medium">Featured Image</label>

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
                <label className="block mb-1 font-medium">Content</label>
                <MemoTextEditor
                  value={formData.content}
                  onChange={(val: string) =>
                    setFormData((p: any) => ({ ...p, content: val }))
                  }
                />
              </div>
            </div>

            <Button onClick={handleUpdate}>Update Blog</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EditBlogClient;
