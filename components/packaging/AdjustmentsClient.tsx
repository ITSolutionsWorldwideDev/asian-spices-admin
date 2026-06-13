// apps/admin/components/packaging/AdjustmentsClient.tsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdjustmentsClient({ storeId, availableTypes }: { storeId: string; availableTypes: any[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    packaging_type_id: availableTypes[0]?.id || "",
    type: "damaged",
    quantity: 1,
    reason: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/store/packaging/adjustments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ store_id: storeId, ...form }),
      });
      const data = await res.json();
      if (data.success) {
        setForm({ ...form, quantity: 1, reason: "" });
        router.refresh();
      } else {
        alert(data.error);
      }
    } catch {
      alert("Error reporting stock layout changes parameters.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-gray-100 rounded-xl shadow-sm p-6 space-y-4">
      <h3 className="text-base font-bold text-gray-900">Log Discrepancy / Breakage</h3>

      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Target Material</label>
        <select
          value={form.packaging_type_id}
          onChange={(e) => setForm({ ...form, packaging_type_id: e.target.value })}
          className="w-full text-sm border border-gray-200 rounded-lg p-2 bg-white"
        >
          {availableTypes.map((t) => (
            <option key={t.id} value={t.id}>{t.name} ({t.sku})</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Action Flow Mode</label>
        <select
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value })}
          className="w-full text-sm border border-gray-200 rounded-lg p-2 bg-white"
        >
          <option value="damaged">Move to Unusable Damaged</option>
          <option value="manual_adjustment">Manual Variance Calibration Balance</option>
        </select>
      </div>

      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Quantity Shift Value</label>
        <input
          type="number"
          min="1"
          value={form.quantity}
          onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value, 10) || 1 })}
          className="w-full text-sm border border-gray-200 rounded-lg p-2"
        />
      </div>

      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Audit Explanatory Notes</label>
        <textarea
          rows={3}
          value={form.reason}
          onChange={(e) => setForm({ ...form, reason: e.target.value })}
          placeholder="Clarify specific structural background context..."
          className="w-full text-sm border border-gray-200 rounded-lg p-2"
        />
      </div>

      <button
        type="submit"
        disabled={loading || !form.packaging_type_id}
        className="w-full text-center py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 rounded-lg transition-colors"
      >
        {loading ? "Registering Adjustment..." : "Commit Inventory Delta Log"}
      </button>
    </form>
  );
}