// components/platform/recipes/tags/BulkRecipeTagEditor.tsx
"use client";

import { useState } from "react";

export default function BulkRecipeTagEditor() {
  const [recipeIds, setRecipeIds] = useState("");
  const [tagIds, setTagIds] = useState("");

  const submit = async () => {
    const res = await fetch("/api/recipe-tags/assign/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipe_ids: recipeIds.split(","),
        tag_ids: tagIds.split(","),
      }),
    });

    const data = await res.json();

    alert(data.message || "Done");
  };

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="font-bold mb-3">Bulk Tag Editor</h3>

      <textarea
        placeholder="recipe ids comma separated"
        className="w-full border p-2 mb-2"
        onChange={(e) => setRecipeIds(e.target.value)}
      />

      <textarea
        placeholder="tag ids comma separated"
        className="w-full border p-2 mb-2"
        onChange={(e) => setTagIds(e.target.value)}
      />

      <button
        onClick={submit}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        Apply Tags
      </button>
    </div>
  );
}