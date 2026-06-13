// apps/admin/components/platform/stores/FiltersBar.tsx

"use client";

import { useRouter, useSearchParams } from "next/navigation";

export default function FiltersBar() {
  const router = useRouter();
  const params = useSearchParams();

  function update(key: string, value: string) {
    const p = new URLSearchParams(params.toString());
    value ? p.set(key, value) : p.delete(key);
    p.delete("page");
    router.push(`?${p.toString()}`);
  }

  return (
    <div className="flex gap-3 mb-4">
      <input
        placeholder="Search stores..."
        defaultValue={params.get("q") ?? ""}
        onChange={(e) => update("q", e.target.value)}
        className="input w-full form-control"
      />

      <select
        defaultValue={params.get("status") ?? ""}
        onChange={(e) => update("status", e.target.value)}
        className="input w-40"
      >
        <option value="">All</option>
        <option value="active">Active</option>
        <option value="suspended">Suspended</option>
      </select>
    </div>
  );
}
