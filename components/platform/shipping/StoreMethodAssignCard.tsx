// components/platform/shipping/StoreMethodAssignCard.tsx

"use client";

import { useState, useTransition } from "react";

export default function StoreMethodAssignCard({
  storeId,
  method,
  assignment,
}: any) {

  const [enabled, setEnabled] = useState(
    assignment?.is_enabled || false
  );

  const [pending, startTransition] = useTransition();

  const save = () => {
    startTransition(async () => {
      await fetch("/api/platform/shipping/store-methods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeId,
          methodId: method.id,
          is_enabled: enabled,
        }),
      });
    });
  };

  return (
    <div className="border rounded-xl p-4 bg-white shadow-sm space-y-3">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">{method.name}</h3>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
          />
          Enabled
        </label>
      </div>

      <div className="text-xs text-gray-500">
        Provider: {method.provider_name}
      </div>

      <button
        onClick={save}
        disabled={pending}
        className="btn btn-primary w-full"
      >
        {pending ? "Saving..." : "Save Method"}
      </button>
    </div>
  );
}