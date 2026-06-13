// components/platform/recipes/RecipeCard.tsx

"use client";

import Link from "next/link";

export default function RecipeCard({
  recipe,
  onDelete,
  onToggleStatus,
}: any) {
  return (
    <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
      <div className="aspect-video bg-gray-100 overflow-hidden">
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

      <div className="p-4">
        <div className="flex justify-between mb-3">
          <span className="text-xs bg-gray-100 px-2 py-1 rounded">
            {recipe.category_name}
          </span>

          <span
            className={`text-xs px-2 py-1 rounded ${
              recipe.status === "published"
                ? "bg-green-100 text-green-700"
                : "bg-yellow-100 text-yellow-700"
            }`}
          >
            {recipe.status}
          </span>
        </div>

        <h3 className="font-semibold text-lg line-clamp-2">
          {recipe.title}
        </h3>

        <p className="text-sm text-gray-500 mt-2">
          {recipe.slug}
        </p>

        <div className="flex gap-2 mt-5">
          <Link
            href={`/platform/recipes/${recipe.id}`}
            className="btn btn-primary flex-1"
          >
            Edit
          </Link>

          <button
            onClick={onToggleStatus}
            className="btn btn-secondary"
          >
            Toggle
          </button>

          <button
            onClick={onDelete}
            className="btn btn-danger"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}