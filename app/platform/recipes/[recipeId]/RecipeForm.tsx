// app/platform/recipes/[recipeId]/RecipeForm.tsx

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "react-feather";

import { useEffect, useState, useTransition } from "react";
import { saveRecipe } from "@/components/platform/recipes/actions";
import RecipeEngagement from "@/components/platform/recipes/RecipeEngagement";
import TextEditorNew from "@/core/common/texteditor/texteditor";

import { useToast } from "@/core/ui";
import { extractYoutubeData } from "@/core/utils";

export default function RecipeForm({ recipe }: { recipe?: any }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [loading, setLoading] = useState(false);
  const [generatingNutrition, setGeneratingNutrition] = useState(false);
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

    ingredients: (recipe?.ingredients || []).map((item: any) => ({
      ingredient_name: item.ingredient_name || "",
      quantity: item.quantity ?? "",
      unit: item.unit || "",
    })),

    instructions: (recipe?.instructions || []).map((item: any) => ({
      step_title: item.step_title || "",
      step_description: item.step_description || "",
      duration_minutes: item.duration_minutes ?? "",
    })),

    nutrition: (recipe?.nutrition || []).map((item: any) => ({
      nutrient_name: item.nutrient_name || "",
      value: item.value ?? "",
      unit: item.unit || "",
      daily_value_percent: item.daily_value_percent ?? "",
    })),
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

  const handleGenerateNutrition = async () => {
    if (!recipe?.id) {
      showToast("error", "Save the recipe first before generating nutrition");
      return;
    }

    try {
      setGeneratingNutrition(true);

      const res = await fetch(`/api/recipes/${recipe.id}/nutrition/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formState.title,
          shortDescription: formState.shortDescription,
          content: formState.content,
          servings: recipe?.servings,
          ingredients: formState.ingredients,
          instructions: formState.instructions,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        showToast("error", data.error || "Failed to generate nutrition");
        return;
      }

      setFormState((prev: any) => ({
        ...prev,
        nutrition: (data.items || []).map((item: any) => ({
          nutrient_name: item.nutrient_name || "",
          value: item.value ?? "",
          unit: item.unit || "",
          daily_value_percent: item.daily_value_percent ?? "",
        })),
      }));

      showToast("success", "Nutrition generated with Gemini");
    } catch (err) {
      console.error(err);
      showToast("error", "Failed to generate nutrition");
    } finally {
      setGeneratingNutrition(false);
    }
  };

  const handleSubmit = async (formData: FormData) => {
    try {
      setLoading(true);
      startTransition(async () => {
        Object.entries(formState).forEach(([key, value]) => {
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
          if (!isEdit && result.recipeId) {
            router.push(`/platform/recipes/${result.recipeId}`);
          }
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

          <div className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Ingredients</h3>
              <button
                type="button"
                className="text-sm text-blue-600"
                onClick={() =>
                  setFormState((prev: any) => ({
                    ...prev,
                    ingredients: [
                      ...prev.ingredients,
                      { ingredient_name: "", quantity: "", unit: "" },
                    ],
                  }))
                }
              >
                + Add ingredient
              </button>
            </div>

            {formState.ingredients.length === 0 && (
              <p className="text-sm text-gray-400">No ingredients yet.</p>
            )}

            {formState.ingredients.map((item: any, index: number) => (
              <div key={index} className="grid grid-cols-12 gap-2">
                <input
                  className="col-span-6 border rounded-lg px-3 py-2"
                  placeholder="Ingredient name"
                  value={item.ingredient_name}
                  onChange={(e) =>
                    setFormState((prev: any) => {
                      const next = [...prev.ingredients];
                      next[index] = {
                        ...next[index],
                        ingredient_name: e.target.value,
                      };
                      return { ...prev, ingredients: next };
                    })
                  }
                />
                <input
                  className="col-span-3 border rounded-lg px-3 py-2"
                  placeholder="Qty"
                  value={item.quantity}
                  onChange={(e) =>
                    setFormState((prev: any) => {
                      const next = [...prev.ingredients];
                      next[index] = {
                        ...next[index],
                        quantity: e.target.value,
                      };
                      return { ...prev, ingredients: next };
                    })
                  }
                />
                <input
                  className="col-span-2 border rounded-lg px-3 py-2"
                  placeholder="Unit"
                  value={item.unit}
                  onChange={(e) =>
                    setFormState((prev: any) => {
                      const next = [...prev.ingredients];
                      next[index] = { ...next[index], unit: e.target.value };
                      return { ...prev, ingredients: next };
                    })
                  }
                />
                <button
                  type="button"
                  className="col-span-1 text-red-500"
                  onClick={() =>
                    setFormState((prev: any) => ({
                      ...prev,
                      ingredients: prev.ingredients.filter(
                        (_: any, i: number) => i !== index,
                      ),
                    }))
                  }
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <div className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Instructions</h3>
              <button
                type="button"
                className="text-sm text-blue-600"
                onClick={() =>
                  setFormState((prev: any) => ({
                    ...prev,
                    instructions: [
                      ...prev.instructions,
                      {
                        step_title: "",
                        step_description: "",
                        duration_minutes: "",
                      },
                    ],
                  }))
                }
              >
                + Add step
              </button>
            </div>

            {formState.instructions.length === 0 && (
              <p className="text-sm text-gray-400">No instruction steps yet.</p>
            )}

            {formState.instructions.map((item: any, index: number) => (
              <div key={index} className="border rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Step {index + 1}</span>
                  <button
                    type="button"
                    className="text-red-500 text-sm"
                    onClick={() =>
                      setFormState((prev: any) => ({
                        ...prev,
                        instructions: prev.instructions.filter(
                          (_: any, i: number) => i !== index,
                        ),
                      }))
                    }
                  >
                    Remove
                  </button>
                </div>
                <input
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="Step title"
                  value={item.step_title}
                  onChange={(e) =>
                    setFormState((prev: any) => {
                      const next = [...prev.instructions];
                      next[index] = {
                        ...next[index],
                        step_title: e.target.value,
                      };
                      return { ...prev, instructions: next };
                    })
                  }
                />
                <textarea
                  className="w-full border rounded-lg px-3 py-2"
                  rows={3}
                  placeholder="Step description"
                  value={item.step_description}
                  onChange={(e) =>
                    setFormState((prev: any) => {
                      const next = [...prev.instructions];
                      next[index] = {
                        ...next[index],
                        step_description: e.target.value,
                      };
                      return { ...prev, instructions: next };
                    })
                  }
                />
                <input
                  className="w-40 border rounded-lg px-3 py-2"
                  placeholder="Minutes"
                  value={item.duration_minutes}
                  onChange={(e) =>
                    setFormState((prev: any) => {
                      const next = [...prev.instructions];
                      next[index] = {
                        ...next[index],
                        duration_minutes: e.target.value,
                      };
                      return { ...prev, instructions: next };
                    })
                  }
                />
              </div>
            ))}
          </div>

          <div className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="font-semibold">Nutrition</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Per serving. Generate estimates from recipe data with Gemini.
                </p>
              </div>
              <div className="flex items-center gap-2">
                {isEdit && (
                  <button
                    type="button"
                    className="text-sm px-3 py-1.5 rounded-lg border border-purple-200 text-purple-700 hover:bg-purple-50 disabled:opacity-50"
                    onClick={handleGenerateNutrition}
                    disabled={generatingNutrition || pending}
                  >
                    {generatingNutrition ? "Generating..." : "Generate nutrition automatically"}
                  </button>
                )}
                <button
                  type="button"
                  className="text-sm text-blue-600"
                  onClick={() =>
                    setFormState((prev: any) => ({
                      ...prev,
                      nutrition: [
                        ...prev.nutrition,
                        {
                          nutrient_name: "",
                          value: "",
                          unit: "",
                          daily_value_percent: "",
                        },
                      ],
                    }))
                  }
                >
                  + Add nutrient
                </button>
              </div>
            </div>

            {formState.nutrition.length === 0 && (
              <p className="text-sm text-gray-400">
                No nutrition facts yet. Add rows manually or generate with Gemini.
              </p>
            )}

            {formState.nutrition.length > 0 && (
              <div className="grid grid-cols-12 gap-2 px-1 text-xs font-medium text-gray-500">
                <span className="col-span-4">Nutrient</span>
                <span className="col-span-2">Value</span>
                <span className="col-span-2">Unit</span>
                <span className="col-span-3">Percentage (% DV)</span>
                <span className="col-span-1" />
              </div>
            )}

            {formState.nutrition.map((item: any, index: number) => (
              <div
                key={index}
                className="grid grid-cols-12 gap-2 items-center"
              >
                <input
                  className="col-span-4 border rounded-lg px-3 py-2"
                  placeholder="Nutrient name"
                  value={item.nutrient_name}
                  onChange={(e) =>
                    setFormState((prev: any) => {
                      const next = [...prev.nutrition];
                      next[index] = {
                        ...next[index],
                        nutrient_name: e.target.value,
                      };
                      return { ...prev, nutrition: next };
                    })
                  }
                />
                <input
                  className="col-span-2 border rounded-lg px-3 py-2"
                  placeholder="Value"
                  value={item.value}
                  onChange={(e) =>
                    setFormState((prev: any) => {
                      const next = [...prev.nutrition];
                      next[index] = { ...next[index], value: e.target.value };
                      return { ...prev, nutrition: next };
                    })
                  }
                />
                <input
                  className="col-span-2 border rounded-lg px-3 py-2"
                  placeholder="Unit"
                  value={item.unit}
                  onChange={(e) =>
                    setFormState((prev: any) => {
                      const next = [...prev.nutrition];
                      next[index] = { ...next[index], unit: e.target.value };
                      return { ...prev, nutrition: next };
                    })
                  }
                />
                <input
                  className="col-span-3 border rounded-lg px-3 py-2"
                  placeholder="Daily value %"
                  value={item.daily_value_percent}
                  onChange={(e) =>
                    setFormState((prev: any) => {
                      const next = [...prev.nutrition];
                      next[index] = {
                        ...next[index],
                        daily_value_percent: e.target.value,
                      };
                      return { ...prev, nutrition: next };
                    })
                  }
                />
                <button
                  type="button"
                  className="col-span-1 text-red-500"
                  onClick={() =>
                    setFormState((prev: any) => ({
                      ...prev,
                      nutrition: prev.nutrition.filter(
                        (_: any, i: number) => i !== index,
                      ),
                    }))
                  }
                >
                  ✕
                </button>
              </div>
            ))}
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

          {isEdit && (
            <RecipeEngagement
              owner={recipe?.owner}
              likesCount={recipe?.likes_count ?? 0}
              recentFavorites={recipe?.recent_favorites ?? []}
            />
          )}

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