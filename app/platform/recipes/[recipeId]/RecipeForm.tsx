// app/platform/recipes/[recipeId]/RecipeForm.tsx

"use client";

import Link from "next/link";
import { ArrowLeft } from "react-feather";

import { useEffect, useState, useTransition } from "react";
import { saveRecipe } from "@/components/platform/recipes/actions";
import TextEditorNew from "@/core/common/texteditor/texteditor";

import { useToast } from "@/core/ui";
import { extractYoutubeData } from "@/core/utils";

export default function RecipeForm({ recipe }: { recipe?: any }) {
  const [pending, startTransition] = useTransition();

  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const isEdit = !!recipe;

  const [categories, setCategories] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);

  const [formState, setFormState] = useState({
    title: recipe?.title || "",
    slug: recipe?.slug || "",

    shortDescription: recipe?.short_description || "",
    content: recipe?.content || "",

    youtubeUrl: recipe?.youtube_url || "",

    thumbnailUrl: recipe?.thumbnail_url || "",

    categoryId: recipe?.category_id || "",

    tagIds: recipe?.tag_ids || [],

    status: recipe?.status || "draft",

    seoTitle: recipe?.seo_title || "",
    seoDescription: recipe?.seo_description || "",
    seoKeywords: recipe?.seo_keywords || "",
  });

  useEffect(() => {
    async function loadData() {
      const [catRes, tagRes] = await Promise.all([
        fetch("/api/recipe-categories"),
        fetch("/api/recipe-tags"),
      ]);

      const catData = await catRes.json();
      const tagData = await tagRes.json();

      setCategories(catData.items || []);
      setTags(tagData.items || []);
    }

    loadData();
  }, []);

  // useEffect(() => {
  //   async function loadCategories() {
  //     const res = await fetch(`/api/recipe-categories`);

  //     const data = await res.json();

  //     setCategories(data.items || []);

  //     // setCategories(data);
  //   }

  //   loadCategories();
  // }, []);

  const toggleTag = (tagId: string) => {
    setFormState((prev: any) => {
      const exists = prev.tagIds.includes(tagId);

      return {
        ...prev,
        tagIds: exists
          ? prev.tagIds.filter((id: string) => id !== tagId)
          : [...prev.tagIds, tagId],
      };
    });
  };

  const generateSlug = (text: string) =>
    text
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^\w-]+/g, "");

  const handleChange = (key: string, value: string) => {
    setFormState((prev) => {
      const updated = {
        ...prev,
        [key]: value,
      };

      if (!isEdit && key === "title") {
        updated.slug = generateSlug(value);
      }

      return updated;
    });
  };

  const handleSubmit = async (formData: FormData) => {
    try {
      setLoading(true);
      startTransition(async () => {
        Object.entries(formState).forEach(([key, value]) => {
          // formData.set(key, value);
          if (Array.isArray(value)) {
            formData.set(key, JSON.stringify(value));
          } else {
            formData.set(key, value);
          }
        });

        const result = await saveRecipe(recipe?.id, formData);

        console.log("result ==== ", result);

        if (result?.success) {
          showToast("success", "Recipe saved");
        } else {
          if (result?.message) showToast("error", result.message);
        }
      });
    } catch (err) {
      console.error(err);
      // showToast("error", "Failed to load recipe tags");
    } finally {
      setLoading(false);
    }
  };

  const youtubeData = extractYoutubeData(formState.youtubeUrl);

  return (
    <form
      action={handleSubmit}
      className="bg-white border rounded-xl p-8 space-y-6"
    >
      <div className="flex justify-between items-center border-b pb-5">
        <div>
          <h2 className="text-2xl font-bold">
            {isEdit ? "Edit Recipe" : "Create Recipe"}
          </h2>

          <p className="text-gray-500 text-sm">Manage recipe content</p>
        </div>

        <Link
          href="/platform/recipes"
          className="flex items-center gap-2 text-sm"
        >
          <ArrowLeft size={16} />
          Back
        </Link>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* LEFT */}
        <div className="xl:col-span-2 space-y-5">
          <InputField
            label="Recipe Title"
            value={formState.title}
            onChange={(v: any) => handleChange("title", v)}
          />

          <InputField
            label="Slug"
            value={formState.slug}
            onChange={(v: any) => handleChange("slug", v)}
          />

          <TextAreaField
            label="Short Description"
            value={formState.shortDescription}
            onChange={(v: any) => handleChange("shortDescription", v)}
          />

          {/* <TextAreaField
            label="Recipe Content"
            value={formState.content}
            onChange={(v: any) => handleChange("content", v)}
          /> */}

          <div>
            <label className="block mb-2 text-sm font-semibold">
              Recipe Content
            </label>

            <TextEditorNew
              value={formState.content}
              onChange={(value) => handleChange("content", value)}
            />
          </div>
        </div>

        {/* RIGHT */}
        <div className="space-y-5">
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-4">Publishing</h3>

            <SelectField
              label="Status"
              value={formState.status}
              onChange={(v: any) => handleChange("status", v)}
              options={[
                {
                  label: "Draft",
                  value: "draft",
                },
                {
                  label: "Published",
                  value: "published",
                },
              ]}
            />
          </div>

          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-4">Video</h3>

            <InputField
              label="Youtube URL"
              value={formState.youtubeUrl}
              onChange={(v: any) => handleChange("youtubeUrl", v)}
            />

            {youtubeData && (
              <iframe
                className="w-full aspect-video rounded-lg mt-4"
                src={youtubeData.embedUrl}
                allowFullScreen
              />
            )}
          </div>

          {/* 
              {formState.youtubeUrl && (
              <iframe
                className="w-full aspect-video rounded-lg mt-4"
                src={`https://www.youtube.com/embed/${
                  formState.youtubeUrl.split("v=")[1]
                }`}
              />
            )}
              */}
          <div className="border rounded-lg p-4">
            <SelectField
              label="Category"
              value={formState.categoryId}
              onChange={(v: any) => handleChange("categoryId", v)}
              options={categories?.map((c) => ({
                label: c.name,
                value: c.id,
              }))}
            />
          </div>

          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-4">Recipe Tags</h3>

            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => {
                const selected = formState.tagIds.includes(tag.id);

                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                    className={`px-3 py-1 rounded-full border text-sm transition ${
                      selected
                        ? "text-white border-transparent"
                        : "bg-white border-gray-300"
                    }`}
                    style={{
                      background: selected ? tag.color : undefined,
                    }}
                  >
                    {tag.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="border rounded-lg p-4 space-y-4">
            <h3 className="font-semibold">SEO</h3>

            <InputField
              label="SEO Title"
              value={formState.seoTitle}
              onChange={(v: any) => handleChange("seoTitle", v)}
            />

            <TextAreaField
              label="SEO Description"
              value={formState.seoDescription}
              onChange={(v: any) => handleChange("seoDescription", v)}
            />

            <InputField
              label="SEO Keywords"
              value={formState.seoKeywords}
              onChange={(v: any) => handleChange("seoKeywords", v)}
            />

            <p className="text-xs text-gray-500">
              Separate keywords with commas
            </p>
          </div>
        </div>
      </div>

      <button disabled={pending} className="btn btn-primary w-full">
        {pending ? "Saving..." : isEdit ? "Update Recipe" : "Create Recipe"}
      </button>
    </form>
  );
}

function InputField({ label, value, onChange }: any) {
  return (
    <div>
      <label className="block mb-2 text-sm font-semibold">{label}</label>

      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border rounded-lg px-4 py-2"
      />
    </div>
  );
}

function TextAreaField({ label, value, onChange }: any) {
  return (
    <div>
      <label className="block mb-2 text-sm font-semibold">{label}</label>

      <textarea
        rows={6}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border rounded-lg px-4 py-2"
      />
    </div>
  );
}

function SelectField({ label, value, onChange, options }: any) {
  return (
    <div>
      <label className="block mb-2 text-sm font-semibold">{label}</label>

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border rounded-lg px-4 py-2"
      >
        <option value="">Select option</option>

        {options.map((o: any) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

/* 

const videoId = extractYoutubeId(formState.youtubeUrl);

{videoId && (
  <iframe
    className="w-full aspect-video rounded-lg mt-4"
    src={`https://www.youtube.com/embed/${videoId}`}
    allowFullScreen
  />
)}

*/
