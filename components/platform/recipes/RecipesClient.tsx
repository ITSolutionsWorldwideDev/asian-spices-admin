// components/platform/recipes/RecipesClient.tsx

"use client";

import Link from "next/link";
import { useOptimistic } from "react";

import RecipeCard from "./RecipeCard";
import FiltersBar from "./FiltersBar";
import { deleteRecipe, setRecipeStatus } from "./actions";

export default function RecipesClient({
  recipes,
  total,
  page,
  pageSize,
}: any) {
  const totalPages = Math.ceil(total / pageSize);

  const [optimisticRecipes, updateOptimistic] =
    useOptimistic(recipes, (state, action: any) => {
      if (action.type === "delete") {
        return state.filter((r: any) => r.id !== action.id);
      }

      if (action.type === "status") {
        return state.map((r: any) =>
          r.id === action.id
            ? { ...r, status: action.status }
            : r
        );
      }

      return state;
    });

  return (
    <>
      <div className="page-header flex justify-between items-center mb-5">
        <div>
          <h4 className="text-xl font-bold">
            Recipes
          </h4>

          <h6 className="text-gray-500">
            Manage recipe content
          </h6>
        </div>

        <Link
          href="/platform/recipes/new"
          className="btn btn-primary"
        >
          Add Recipe
        </Link>
      </div>

      <div className="card mb-5">
        <div className="card-header">
          <FiltersBar />
        </div>
      </div>

      {optimisticRecipes.length === 0 ? (
        <div className="card">
          <div className="card-body py-10 text-center text-gray-500">
            No recipes found
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {optimisticRecipes.map((recipe: any) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              onDelete={async () => {
                updateOptimistic({
                  type: "delete",
                  id: recipe.id,
                });

                await deleteRecipe(recipe.id);
              }}
              onToggleStatus={async () => {
                const status =
                  recipe.status === "published"
                    ? "draft"
                    : "published";

                updateOptimistic({
                  type: "status",
                  id: recipe.id,
                  status,
                });

                await setRecipeStatus(
                  recipe.id,
                  status
                );
              }}
            />
          ))}
        </div>
      )}

      <div className="flex justify-center gap-2 mt-8">
        {Array.from({ length: totalPages }).map(
          (_, i) => (
            <Link
              key={i}
              href={`?page=${i + 1}`}
              className={`px-3 py-1 rounded ${
                page === i + 1
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200"
              }`}
            >
              {i + 1}
            </Link>
          )
        )}
      </div>
    </>
  );
}