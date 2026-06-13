// components/platform/recipes/tags/RecipeTagOrder.tsx

"use client";

import { useEffect, useState } from "react";

type Tag = {
  id: string;
  name: string;
  sort_order: number;
};

export default function RecipeTagOrder() {
  const [tags, setTags] = useState<Tag[]>([]);

  useEffect(() => {
    fetch("/api/recipe-tags")
      .then((r) => r.json())
      .then((d) =>
        setTags(
          (d.items || []).sort((a: Tag, b: Tag) => a.sort_order - b.sort_order),
        ),
      );
  }, []);

  const move = (index: number, dir: -1 | 1) => {
    const newTags = [...tags];
    const target = index + dir;

    if (target < 0 || target >= tags.length) return;

    [newTags[index], newTags[target]] = [newTags[target], newTags[index]];

    setTags(newTags);
  };

  const saveOrder = async () => {
    await fetch("/api/recipe-tags/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: tags.map((t, i) => ({
          id: t.id,
          sort_order: i,
        })),
      }),
    });

    alert("Saved");
  };

  return (
    <div className="border p-4 rounded">
      <h3 className="font-bold mb-3">Tag Ordering</h3>

      {tags.map((tag, i) => (
        <div key={tag.id} className="flex justify-between border p-2 mb-2">
          <span>{tag.name}</span>

          <div className="flex gap-2">
            <button onClick={() => move(i, -1)}>↑</button>
            <button onClick={() => move(i, 1)}>↓</button>
          </div>
        </div>
      ))}

      <button
        onClick={saveOrder}
        className="mt-3 bg-green-600 text-white px-4 py-2 rounded"
      >
        Save Order
      </button>
    </div>
  );
}
