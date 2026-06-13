// apps/admin/app/platform/packaging/addons/new/AddonForm.tsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Addon = {
  id?: string;
  name?: string;
  sku?: string;
  addon_type?: string;
  description?: string;
  cost_price?: number;
  is_active?: boolean;
};

export default function AddonForm({ addon }: { addon?: Addon }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: addon?.name || "",
    sku: addon?.sku || "",
    addon_type: addon?.addon_type || "",
    description: addon?.description || "",
    cost_price: addon?.cost_price || 0,
    is_active: addon?.is_active ?? true,
  });

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      setError("Addon configuration variant label name is required.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/platform/packaging/addons", {
        method: addon?.id ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: addon?.id,
          ...form,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || "Failed to finalize addon metrics configuration context.");
        return;
      }

      router.refresh();
      router.push("/platform/packaging/addons");
    } catch (err) {
      setError("Network or operational failure communicating with database pipeline.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 space-y-6 rounded-xl border border-gray-100 shadow-sm">
      <div>
        <h2 className="text-xl font-bold text-gray-900">
          {addon ? "Modify Active Addon Configuration" : "Configure New Packaging Addon Option"}
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Define tracking metadata codes, base catalog parameters, and inventory type classes.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Name */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Addon Option Name *</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition text-sm"
            placeholder="Letterpress Greeting Card"
            required
          />
        </div>

        {/* SKU */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Inventory Tracking SKU <span className="text-xs font-normal text-gray-400">(Blank to auto-generate)</span>
          </label>
          <input
            type="text"
            value={form.sku}
            onChange={(e) => setForm({ ...form, sku: e.target.value })}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition text-sm uppercase font-mono"
            placeholder="System Autogen Marker"
          />
        </div>

        {/* Type Select */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Classification Type</label>
          <select
            value={form.addon_type}
            onChange={(e) => setForm({ ...form, addon_type: e.target.value })}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition text-sm bg-white"
          >
            <option value="">Select Category Type Group</option>
            <option value="card">Greeting Card Insert</option>
            <option value="sticker">Branded Premium Sticker</option>
            <option value="flower">Decorative Preserved Flower Placements</option>
            <option value="gift_wrap">Custom Outer Gift Wrap Sheets</option>
            <option value="custom">Bespoke Custom Adjustment</option>
          </select>
        </div>

        {/* Price Input */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Internal Cost Price (€)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={form.cost_price || ""}
            onChange={(e) => setForm({ ...form, cost_price: Math.max(0, parseFloat(e.target.value) || 0) })}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition text-sm"
            placeholder="0.00"
          />
        </div>

        {/* Description */}
        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Internal Item Notes & Descriptions</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition text-sm"
            placeholder="Enter dimension measurements, printing choices, or details for production staff here..."
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-gray-100">
        <label className="flex items-center gap-2 cursor-pointer select-none text-sm font-medium text-gray-700">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500/20"
          />
          Available for fulfillment choices on customer checkout portals
        </label>

        <div className="flex items-center gap-2.5 justify-end">
          <button
            type="button"
            onClick={() => router.push("/platform/packaging/addons")}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-lg shadow-sm transition-colors"
          >
            {loading ? "Saving parameters..." : "Save Addon Configuration"}
          </button>
        </div>
      </div>
    </div>
  );
}