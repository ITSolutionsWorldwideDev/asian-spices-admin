// apps/admin/components/platform/packaging/rules/RulesClient.tsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RulesClient({
  rules,
  packagingTypes,
}: {
  rules: any[];
  packagingTypes: any[];
}) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Active Edit Tracking State
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    packaging_type_id: "",
    min_weight_kg: 0,
    max_weight_kg: "" as string | number,
    min_order_amount: 0,
    max_order_amount: "" as string | number,
    priority: 0,
    is_active: true,
  });

  const openCreateModal = () => {
    setEditingId(null);
    setForm({
      name: "",
      packaging_type_id: packagingTypes[0]?.id || "",
      min_weight_kg: 0,
      max_weight_kg: "",
      min_order_amount: 0,
      max_order_amount: "",
      priority: Math.max(...rules.map((r) => r.priority || 0), 0) + 10,
      is_active: true,
    });
    setError("");
    setModalOpen(true);
  };

  const openEditModal = (rule: any) => {
    setEditingId(rule.id);
    setForm({
      name: rule.name || "",
      packaging_type_id: rule.packaging_type_id || "",
      min_weight_kg: Number(rule.min_weight_kg || 0),
      max_weight_kg: rule.max_weight_kg ?? "",
      min_order_amount: Number(rule.min_order_amount || 0),
      max_order_amount: rule.max_order_amount ?? "",
      priority: Number(rule.priority || 0),
      is_active: !!rule.is_active,
    });
    setError("");
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      setError("Please input an identification marker for this logic rule.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/platform/packaging/rules", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingId, ...form }),
      });
      const result = await res.json();

      if (!result.success) {
        setError(result.error || "Execution processing exception occurred.");
        return;
      }

      setModalOpen(false);
      router.refresh();
    } catch (err) {
      setError("Unable to process operation across data gateway.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (
      !confirm("Are you sure you want to remove this package allocation rule?")
    )
      return;

    try {
      const res = await fetch(`/api/platform/packaging/rules?id=${id}`, {
        method: "DELETE",
      });
      const result = await res.json();
      if (result.success) {
        router.refresh();
      } else {
        alert(result.error || "Failed to remove entry.");
      }
    } catch (err) {
      alert("Error deleting matching configuration rule.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header element bar */}
      <div className="page-header flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Automation Package Allocations
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Configure dynamic rules to assign specific boxes or mailers based on
            item weights and order totals.
          </p>
        </div>
        <button onClick={openCreateModal} className="btn btn-primary">
          Add Packaging Rule
        </button>
      </div>

      {/* Main Table Interface */}
      {!rules.length ? (
        <div className="bg-white border border-gray-100 rounded-xl p-12 text-center shadow-sm">
          <p className="text-gray-400 font-medium text-sm">
            No package distribution rules established yet.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm text-gray-600">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-gray-700 font-semibold uppercase tracking-wider text-xs">
                  <th className="px-6 py-4">Rule Name</th>
                  <th className="px-6 py-4">Assigned Packaging Type</th>
                  <th className="px-6 py-4">Weight Restriction Range</th>
                  <th className="px-6 py-4">Basket Value Matrix</th>
                  <th className="px-6 py-4">Priority Ranking</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {rules.map((rule: any) => (
                  <tr
                    key={rule.id}
                    className="hover:bg-gray-50/70 transition-colors"
                  >
                    <td className="px-6 py-4 font-semibold text-gray-900">
                      {rule.name}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-800">
                        {rule.packaging_name || "Unassigned"}
                      </div>
                      <span className="inline-flex text-[10px] uppercase font-bold tracking-wider text-gray-400">
                        {rule.package_type || "Unknown"}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-gray-600">
                      {Number(rule.min_weight_kg).toFixed(3)} kg –{" "}
                      {rule.max_weight_kg
                        ? `${Number(rule.max_weight_kg).toFixed(3)} kg`
                        : "∞"}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-gray-600">
                      €{Number(rule.min_order_amount).toFixed(2)} –{" "}
                      {rule.max_order_amount
                        ? `€${Number(rule.max_order_amount).toFixed(2)}`
                        : "∞"}
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-slate-100 px-2 py-0.5 rounded text-xs font-bold text-slate-700">
                        P-{rule.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                          rule.is_active
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-gray-50 text-gray-600 border-gray-200"
                        }`}
                      >
                        {rule.is_active ? "Active" : "Disabled"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => openEditModal(rule)}
                        className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(rule.id)}
                        className="text-rose-600 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Embedded Action Drawer Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white w-full max-w-xl rounded-xl shadow-xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-900 text-base">
                {editingId
                  ? "Update Allocation Configuration Rule"
                  : "Create New Allocation Automation Rule"}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-lg font-medium p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg text-xs">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Rule Identity Identifier Label *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g., Heavy Duty Box Allocation Target"
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-sm outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Target Dynamic Packaging Selection
                </label>
                <select
                  value={form.packaging_type_id}
                  onChange={(e) =>
                    setForm({ ...form, packaging_type_id: e.target.value })
                  }
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-sm bg-white outline-none transition"
                >
                  <option value="">Select Target Package Element</option>
                  {packagingTypes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.sku}) — {t.package_type}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Min Weight (kg)
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    value={form.min_weight_kg}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        min_weight_kg: Math.max(
                          0,
                          parseFloat(e.target.value) || 0,
                        ),
                      })
                    }
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-lg text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Max Weight (kg, blank for ∞)
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    value={form.max_weight_kg}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        max_weight_kg:
                          e.target.value === ""
                            ? ""
                            : parseFloat(e.target.value),
                      })
                    }
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-lg text-sm outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Min Order Value (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.min_order_amount}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        min_order_amount: Math.max(
                          0,
                          parseFloat(e.target.value) || 0,
                        ),
                      })
                    }
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-lg text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Max Order Value (€, blank for ∞)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.max_order_amount}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        max_order_amount:
                          e.target.value === ""
                            ? ""
                            : parseFloat(e.target.value),
                      })
                    }
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-lg text-sm outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Execution Evaluation Priority{" "}
                  <span className="text-gray-400 font-normal lowercase">
                    (Lowest runs first)
                  </span>
                </label>
                <input
                  type="number"
                  step="1"
                  value={form.priority}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      priority: parseInt(e.target.value, 10) || 0,
                    })
                  }
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-lg text-sm outline-none"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer select-none text-sm pt-2 font-medium text-gray-700">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) =>
                    setForm({ ...form, is_active: e.target.checked })
                  }
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500/10"
                />
                Activate rule inside system execution log immediately
              </label>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-lg shadow-sm transition-colors"
              >
                {loading ? "Processing..." : "Commit Rule Logic"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
