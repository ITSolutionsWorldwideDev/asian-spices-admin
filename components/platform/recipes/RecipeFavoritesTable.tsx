"use client";

import Link from "next/link";
import { useState } from "react";
import { useToast } from "@/core/ui";
import { suggestedDiscountFromLikes } from "@/lib/recipes/like-discount-utils";

type RecipeRow = {
  id: string;
  title: string;
  slug: string;
  thumbnail_url?: string | null;
  status: string;
  owner_id?: string | null;
  owner_name?: string | null;
  owner_email?: string | null;
  likes_count: number;
  discount_type?: string | null;
  discount_value?: number | string | null;
};

export default function RecipeFavoritesTable({
  recipes,
  total,
  page,
  pageSize,
  q,
}: {
  recipes: RecipeRow[];
  total: number;
  page: number;
  pageSize: number;
  q?: string;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const { showToast } = useToast();
  const [rows, setRows] = useState(recipes);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<
    Record<string, { discountType: "PERCENT" | "FLAT"; discountValue: string }>
  >(() =>
    Object.fromEntries(
      recipes.map((recipe) => [
        recipe.id,
        {
          discountType:
            recipe.discount_type === "FLAT" ? "FLAT" : ("PERCENT" as const),
          discountValue:
            recipe.discount_value != null && recipe.discount_value !== ""
              ? String(recipe.discount_value)
              : String(suggestedDiscountFromLikes(recipe.likes_count)),
        },
      ]),
    ),
  );

  const updateDraft = (
    recipeId: string,
    patch: Partial<{ discountType: "PERCENT" | "FLAT"; discountValue: string }>,
  ) => {
    setDrafts((prev) => ({
      ...prev,
      [recipeId]: { ...prev[recipeId], ...patch },
    }));
  };

  const applySuggested = (recipe: RecipeRow) => {
    updateDraft(recipe.id, {
      discountType: "PERCENT",
      discountValue: String(suggestedDiscountFromLikes(recipe.likes_count)),
    });
  };

  const saveDiscount = async (recipe: RecipeRow) => {
    const draft = drafts[recipe.id];
    if (!draft?.discountValue) {
      showToast("error", "Enter a discount value");
      return;
    }

    try {
      setSavingId(recipe.id);

      const res = await fetch(`/api/recipes/${recipe.id}/like-discount`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          discountType: draft.discountType,
          discountValue: draft.discountValue,
          userId: recipe.owner_id,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        showToast("error", data.error || "Failed to save discount");
        return;
      }

      setRows((prev) =>
        prev.map((row) =>
          row.id === recipe.id
            ? {
                ...row,
                discount_type: data.item.discount_type,
                discount_value: data.item.discount_value,
              }
            : row,
        ),
      );

      showToast("success", "Discount saved for recipe owner");
    } catch (err) {
      console.error(err);
      showToast("error", "Failed to save discount");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <>
      <div className="card-body p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-semibold">
                  Recipe
                </th>
                <th className="text-left px-6 py-4 text-sm font-semibold">
                  Owner
                </th>
                <th className="text-left px-6 py-4 text-sm font-semibold">
                  Likes
                </th>
                <th className="text-left px-6 py-4 text-sm font-semibold">
                  Owner discount
                </th>
                <th className="text-left px-6 py-4 text-sm font-semibold">
                  Status
                </th>
                <th className="text-left px-6 py-4 text-sm font-semibold">
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {rows.map((recipe) => {
                const draft = drafts[recipe.id];
                const suggested = suggestedDiscountFromLikes(recipe.likes_count);

                return (
                  <tr key={recipe.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <img
                          src={recipe.thumbnail_url || "/placeholder.png"}
                          alt={recipe.title}
                          className="w-14 h-14 rounded-lg object-cover border"
                        />
                        <div>
                          <p className="font-semibold">{recipe.title}</p>
                          <p className="text-sm text-gray-500">{recipe.slug}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      {recipe.owner_name || recipe.owner_email ? (
                        <div>
                          <p className="font-medium">
                            {recipe.owner_name || "Unnamed user"}
                          </p>
                          <p className="text-sm text-gray-500">
                            {recipe.owner_email || "—"}
                          </p>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">
                          Unknown owner
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full bg-pink-100 text-pink-700 text-sm font-semibold">
                        {Number(recipe.likes_count).toLocaleString()} likes
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="space-y-2 min-w-[220px]">
                        <p className="text-xs text-gray-500">
                          Suggested: {suggested}% (1 like = 1%)
                        </p>

                        <div className="flex gap-2">
                          <select
                            className="border rounded-lg px-2 py-2 text-sm"
                            value={draft?.discountType || "PERCENT"}
                            onChange={(e) =>
                              updateDraft(recipe.id, {
                                discountType: e.target.value as
                                  | "PERCENT"
                                  | "FLAT",
                              })
                            }
                          >
                            <option value="PERCENT">%</option>
                            <option value="FLAT">Flat</option>
                          </select>

                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            className="border rounded-lg px-3 py-2 text-sm w-24"
                            value={draft?.discountValue || ""}
                            onChange={(e) =>
                              updateDraft(recipe.id, {
                                discountValue: e.target.value,
                              })
                            }
                          />
                        </div>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            className="text-xs px-2 py-1 rounded border"
                            onClick={() => applySuggested(recipe)}
                          >
                            Use likes
                          </button>

                          <button
                            type="button"
                            className="text-xs px-2 py-1 rounded bg-blue-600 text-white disabled:opacity-50"
                            disabled={savingId === recipe.id || !recipe.owner_id}
                            onClick={() => saveDiscount(recipe)}
                          >
                            {savingId === recipe.id ? "Saving..." : "Save"}
                          </button>
                        </div>

                        {!recipe.owner_id && (
                          <p className="text-xs text-amber-600">
                            No owner linked to this recipe
                          </p>
                        )}

                        {recipe.discount_value != null &&
                          recipe.discount_value !== "" && (
                            <p className="text-xs text-green-700">
                              Saved: {recipe.discount_value}
                              {recipe.discount_type === "FLAT" ? " flat" : "%"}
                            </p>
                          )}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          recipe.status === "published"
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {recipe.status}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <Link
                        href={`/platform/recipes/${recipe.id}`}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        View recipe
                      </Link>
                    </td>
                  </tr>
                );
              })}

              {rows.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="text-center py-12 text-gray-500"
                  >
                    No recipes found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 p-4">
          {Array.from({ length: totalPages }).map((_, i) => (
            <Link
              key={i}
              href={`/platform/recipes/favorites?page=${i + 1}${
                q ? `&q=${encodeURIComponent(q)}` : ""
              }`}
              className={`px-3 py-1 rounded ${
                page === i + 1 ? "bg-blue-600 text-white" : "bg-gray-200"
              }`}
            >
              {i + 1}
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
