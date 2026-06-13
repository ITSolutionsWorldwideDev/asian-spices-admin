// components/platform/recipes/FiltersBar.tsx

"use client";

import { useRouter, useSearchParams } from "next/navigation";

export default function FiltersBar() {
  const router = useRouter();

  const params = useSearchParams();

  function update(key: string, value: string) {
    const p = new URLSearchParams(
      params.toString()
    );

    if (value) {
      p.set(key, value);
    } else {
      p.delete(key);
    }

    p.delete("page");

    router.push(`?${p.toString()}`);
  }

  return (
    <div className="flex flex-col lg:flex-row gap-3">
      {/* SEARCH */}
      <input
        placeholder="Search recipes..."
        defaultValue={params.get("q") ?? ""}
        onChange={(e) =>
          update("q", e.target.value)
        }
        className="input form-control w-full"
      />

      {/* STATUS */}
      <select
        defaultValue={params.get("status") ?? ""}
        onChange={(e) =>
          update("status", e.target.value)
        }
        className="input w-full lg:w-44"
      >
        <option value="">All Status</option>

        <option value="draft">
          Draft
        </option>

        <option value="published">
          Published
        </option>

        <option value="archived">
          Archived
        </option>
      </select>

      {/* FEATURED */}
      <select
        defaultValue={params.get("featured") ?? ""}
        onChange={(e) =>
          update("featured", e.target.value)
        }
        className="input w-full lg:w-44"
      >
        <option value="">
          All Recipes
        </option>

        <option value="true">
          Featured
        </option>

        <option value="false">
          Non Featured
        </option>
      </select>
    </div>
  );
}