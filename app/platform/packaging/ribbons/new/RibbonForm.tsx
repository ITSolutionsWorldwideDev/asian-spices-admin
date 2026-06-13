// apps/admin/app/platform/packaging/ribbons/new/RibbonForm.tsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Ribbon = {
  id?: string;
  name?: string;
  sku?: string;
  color?: string;
  material?: string;
  width_mm?: number;
  cost_price?: number;
  is_active?: boolean;
};

export default function RibbonForm({ ribbon }: { ribbon?: Ribbon }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: ribbon?.name || "",
    sku: ribbon?.sku || "",
    color: ribbon?.color || "",
    material: ribbon?.material || "",
    width_mm: ribbon?.width_mm || 0,
    cost_price: ribbon?.cost_price || 0,
    is_active: ribbon?.is_active ?? true,
  });

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      setError("Ribbon Name cannot be left blank.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/platform/packaging/ribbons", {
        method: ribbon?.id ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: ribbon?.id,
          ...form,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || "Failed to save ribbon config parameters");
        return;
      }

      router.refresh();
      router.push("/platform/packaging/ribbons");
    } catch (err) {
      setError("Something went wrong communicating with service handlers.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-6 space-y-6 max-w-4xl mx-auto bg-white shadow rounded-xl">
      <div>
        <h2 className="text-xl font-semibold text-gray-800">
          {ribbon ? "Modify Active Ribbon Variant" : "Configure New Packaging Ribbon"}
        </h2>
        <p className="text-sm text-gray-500">
          Specify core dimension attributes, global raw composition elements, and tracking stock items.
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
          <label className="block text-sm font-semibold text-gray-700 mb-2">Ribbon Name *</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            placeholder="Luxury Gold Satin"
            required
          />
        </div>

        {/* SKU */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Ribbon SKU <span className="text-xs font-normal text-gray-400">(Leave blank to auto-generate)</span>
          </label>
          <input
            type="text"
            value={form.sku}
            onChange={(e) => setForm({ ...form, sku: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition uppercase"
            placeholder="System Autogen Default"
          />
        </div>

        {/* Color */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Color Trim</label>
          <input
            type="text"
            value={form.color}
            onChange={(e) => setForm({ ...form, color: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            placeholder="Champagne Gold"
          />
        </div>

        {/* Material */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Material Core Fabric</label>
          <input
            type="text"
            value={form.material}
            onChange={(e) => setForm({ ...form, material: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            placeholder="Satin Silk Mixture"
          />
        </div>

        {/* Width */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Width (mm)</label>
          <input
            type="number"
            step="1"
            min="0"
            value={form.width_mm || ""}
            onChange={(e) => setForm({ ...form, width_mm: Math.max(0, parseInt(e.target.value) || 0) })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
          />
        </div>

        {/* Cost Price */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Cost Price (€)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={form.cost_price || ""}
            onChange={(e) => setForm({ ...form, cost_price: Math.max(0, parseFloat(e.target.value) || 0) })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
          />
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <span className="text-sm font-medium text-gray-700">Available for Active Orders</span>
        </label>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => router.push("/platform/packaging/ribbons")}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-lg transition shadow-sm"
          >
            {loading ? "Saving Records..." : "Save Ribbon Configuration"}
          </button>
        </div>
      </div>
    </div>
  );
}