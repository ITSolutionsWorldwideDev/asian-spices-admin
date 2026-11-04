// components/platform/recipes/RecipeCard.tsx

"use client";

import Link from "next/link";

export default function RecipeCard({
  recipe,
  onDelete,
  onToggleStatus,
}: any) {
  return (
    <div className="bg-white border rounded-xl overflow-hidden shadow-sm flex flex-col h-full">
      <div className="aspect-video bg-gray-100 overflow-hidden flex-shrink-0">
        {recipe.thumbnail_url ? (
          <img
            src={recipe.thumbnail_url}
            alt={recipe.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            No Thumbnail
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1">
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs bg-gray-100 px-2 py-1 rounded">
            {recipe.category_name}
          </span>

          <span
            className={`text-xs px-2 py-1 rounded font-medium ${
              recipe.status === "published"
                ? "bg-green-100 text-green-700"
                : "bg-yellow-100 text-yellow-700"
            }`}
          >
            {recipe.status}
          </span>
        </div>

        <h3 className="font-semibold text-lg line-clamp-2 min-h-[3.5rem]">
          {recipe.title}
        </h3>

        <p className="text-sm text-gray-500 mt-2 truncate" title={recipe.slug}>
          {recipe.slug}
        </p>

        <p className="text-xs text-gray-500 mt-2">
          {recipe.ingredients_count || 0} ingredients · {recipe.instructions_count || 0} steps
        </p>

        <div className="flex items-center gap-2 mt-auto pt-5">
          <Link
            href={`/platform/recipes/${recipe.id}`}
            className="btn btn-primary !px-3 h-8 text-xs min-w-[56px] inline-flex items-center justify-center text-center"
          >
            Edit
          </Link>

          <button
            onClick={onToggleStatus}
            className="btn btn-secondary !px-2.5 h-8 text-xs flex-1 whitespace-nowrap inline-flex items-center justify-center text-center font-medium"
            title={
              recipe.status === "published"
                ? "Switch to Draft"
                : "Switch to Published"
            }
          >
            {recipe.status === "published" ? "Draft" : "Publish"}
          </button>

          <button
            onClick={onDelete}
            className="btn btn-danger !px-3 h-8 text-xs min-w-[56px] inline-flex items-center justify-center text-center"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
