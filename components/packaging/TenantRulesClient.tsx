// components/packaging/TenantRulesClient.tsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function TenantRulesClient({ rules, packagingTypes, storeId }: any) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    packaging_type_id: packagingTypes[0]?.id || "",
    min_weight_kg: 0,
    max_weight_kg: "",
    min_order_amount: 0,
    max_order_amount: "",
    priority: 10,
  });

  const handleSave = async () => {
    try {
      const res = await fetch("/api/store/packaging/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, store_id: storeId }),
      });
      const data = await res.json();
      if (data.success) {
        setModalOpen(false);
        router.refresh();
      } else {
        alert(data.error);
      }
    } catch {
      alert("Error committing branch localized optimization parameter logic maps.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove local allocation configuration constraint override rule?")) return;
    try {
      const res = await fetch(`/api/store/packaging/rules?id=${id}&store_id=${storeId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) router.refresh();
      else alert(data.error);
    } catch {
      alert("Network deletion linkage timeout.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
        >
          Create Branch Override
        </button>
      </div>

      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse text-sm text-gray-600">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 text-gray-700 font-semibold uppercase tracking-wider text-xs">
              <th className="px-6 py-4">Rule Mapping Indicator</th>
              <th className="px-6 py-4">Scope Tier</th>
              <th className="px-6 py-4">Material Base</th>
              <th className="px-6 py-4">Weight Conditions</th>
              <th className="px-6 py-4">Priority Hierarchy</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {rules.map((rule: any) => {
              const isGlobal = !rule.store_id;
              return (
                <tr key={rule.id} className={`hover:bg-gray-50/40 transition-colors ${isGlobal ? "opacity-75" : "bg-blue-50/10"}`}>
                  <td className="px-6 py-4 font-semibold text-gray-900">{rule.name}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-tight ${
                      isGlobal ? "bg-gray-100 text-gray-600" : "bg-indigo-50 text-indigo-700 border border-indigo-100"
                    }`}>
                      {isGlobal ? "Global System Base" : "Local Custom Override"}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-700">{rule.packaging_name}</td>
                  <td className="px-6 py-4 font-mono text-xs text-gray-500">
                    {Number(rule.min_weight_kg).toFixed(2)}kg – {rule.max_weight_kg ? `${Number(rule.max_weight_kg).toFixed(2)}kg` : "∞"}
                  </td>
                  <td className="px-6 py-4 font-mono text-xs font-bold text-gray-700">P-{rule.priority}</td>
                  <td className="px-6 py-4 text-right">
                    {!isGlobal ? (
                      <button
                        onClick={() => handleDelete(rule.id)}
                        className="text-xs font-medium bg-rose-50 hover:bg-rose-100 text-rose-600 px-2.5 py-1.5 rounded transition-colors"
                      >
                        Delete Override
                      </button>
                    ) : (
                      <span className="text-xs font-medium text-gray-400 select-none italic pr-2">System Lock</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-xl shadow-xl p-6 border border-gray-100 space-y-4">
            <h3 className="text-base font-bold text-gray-900">Add Local Automation Constraint Override</h3>

            <div>
              <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Override Label Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g., Local Light Bubble Mailer Override Routing"
                className="w-full text-sm border border-gray-200 rounded-lg p-2"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Target Box Material</label>
              <select
                value={form.packaging_type_id}
                onChange={(e) => setForm({ ...form, packaging_type_id: e.target.value })}
                className="w-full text-sm border border-gray-200 rounded-lg p-2 bg-white"
              >
                {packagingTypes.map((t: any) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Min Weight (kg)</label>
                <input
                  type="number"
                  value={form.min_weight_kg}
                  onChange={(e) => setForm({ ...form, min_weight_kg: parseFloat(e.target.value) || 0 })}
                  className="w-full text-sm border border-gray-200 rounded-lg p-2"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Max Weight (kg)</label>
                <input
                  type="number"
                  value={form.max_weight_kg}
                  onChange={(e) => setForm({ ...form, max_weight_kg: e.target.value })}
                  className="w-full text-sm border border-gray-200 rounded-lg p-2"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Evaluation Order Priority <span className="text-gray-400 font-normal lowercase">(Lower runs first)</span></label>
              <input
                type="number"
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: parseInt(e.target.value, 10) || 0 })}
                className="w-full text-sm border border-gray-200 rounded-lg p-2"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-50">
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 shadow-xs"
              >
                Apply Local Rule Override
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}