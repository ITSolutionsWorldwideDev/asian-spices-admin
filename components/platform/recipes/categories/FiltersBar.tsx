// apps/admin/components/platform/recipes/categories/FiltersBar.tsx

"use client";

import { useRouter, useSearchParams } from "next/navigation";

export default function FiltersBar() {
  const router = useRouter();

  const params = useSearchParams();

  function update(key: string, value: string) {
    const p = new URLSearchParams(params.toString());

    if (value) {
      p.set(key, value);
    } else {
      p.delete(key);
    }

    router.push(`?${p.toString()}`);
  }

  return (
    <div className="flex gap-3 w-full">
      <input
        placeholder="Search categories..."
        defaultValue={params.get("q") ?? ""}
        onChange={(e) => update("q", e.target.value)}
        className="input form-control w-full"
      />

      <select
        defaultValue={params.get("status") ?? ""}
        onChange={(e) => update("status", e.target.value)}
        className="input w-40"
      >
        <option value="">All Status</option>

        <option value="true">Active</option>

        <option value="false">Inactive</option>
      </select>
    </div>
  );
}
