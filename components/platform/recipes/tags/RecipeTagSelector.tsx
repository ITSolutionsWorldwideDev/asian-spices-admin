// components/platform/recipes/tags/RecipeTagSelector.tsx

"use client";

import { useEffect, useState } from "react";

type Tag = {
  id: string;
  name: string;
  color?: string;
};

export default function RecipeTagSelector({
  recipeId,
  value,
  onChange,
}: {
  recipeId?: string;
  value: string[];
  onChange: (ids: string[]) => void;
}) {
  const [tags, setTags] = useState<Tag[]>([]);

  useEffect(() => {
    fetch("/api/recipe-tags")
      .then((r) => r.json())
      .then((d) => setTags(d.items || []));
  }, []);

  const toggle = (id: string) => {
    const exists = value.includes(id);
    const newValue = exists ? value.filter((v) => v !== id) : [...value, id];

    onChange(newValue);
  };

  return (
    <div className="border rounded-lg p-3">
      <div className="text-sm font-medium mb-2">Tags</div>

      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <button
            key={tag.id}
            type="button"
            onClick={() => toggle(tag.id)}
            className={`px-3 py-1 rounded-full text-sm border transition ${
              value.includes(tag.id)
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-gray-700"
            }`}
            style={{
              borderColor: tag.color || "#ddd",
            }}
          >
            {tag.name}
          </button>
        ))}
      </div>
    </div>
  );
}
