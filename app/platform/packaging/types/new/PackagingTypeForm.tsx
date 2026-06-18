// app/platform/packaging/types/new/PackagingTypeForm.tsx

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { packagingTypeSchema } from "@/lib/validations/packaging";

type PackagingType = {
  id?: string;
  sku?: string;
  name?: string;
  package_type?: string;
  description?: string;
  width_cm?: number | string;
  height_cm?: number | string;
  length_cm?: number | string;
  empty_weight_kg?: number | string;
  max_weight_kg?: number | string;
  material?: string;
  color?: string;
  is_fragile?: boolean;
  is_active?: boolean;
};

export default function PackagingTypeForm({
  packagingType,
}: {
  packagingType?: PackagingType;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [isManualSku, setIsManualSku] = useState(!!packagingType?.id);

  const [form, setForm] = useState({
    name: packagingType?.name || "",
    sku: packagingType?.sku || "",
    package_type: packagingType?.package_type || "box",
    description: packagingType?.description || "",

    empty_weight_kg:
      packagingType?.empty_weight_kg !== undefined
        ? Number(packagingType.empty_weight_kg)
        : ("" as number | ""),
    max_weight_kg: packagingType?.max_weight_kg
      ? Number(packagingType.max_weight_kg)
      : ("" as number | ""),
    width_cm: packagingType?.width_cm
      ? Number(packagingType.width_cm)
      : ("" as number | ""),
    height_cm: packagingType?.height_cm
      ? Number(packagingType.height_cm)
      : ("" as number | ""),
    length_cm: packagingType?.length_cm
      ? Number(packagingType.length_cm)
      : ("" as number | ""),

    material: packagingType?.material || "",
    color: packagingType?.color || "",
    is_fragile: packagingType?.is_fragile ?? false,
    is_active: packagingType?.is_active ?? true,
  });

  useEffect(() => {
    if (!isManualSku && !packagingType?.id) {
      const typePart = form.package_type.toUpperCase();
      const l = form.length_cm ? Math.round(Number(form.length_cm)) : 0;
      const w = form.width_cm ? Math.round(Number(form.width_cm)) : 0;
      const h = form.height_cm ? Math.round(Number(form.height_cm)) : 0;

      let computedSku = `PKG-${typePart}`;
      if (l || w || h) {
        computedSku += `-${l}X${w}X${h}`;
      }

      setForm((prev) => ({ ...prev, sku: computedSku }));
    }
  }, [
    form.package_type,
    form.length_cm,
    form.width_cm,
    form.height_cm,
    isManualSku,
    packagingType?.id,
  ]);

  const handleSubmit = async () => {
    setLoading(true);
    setGlobalError("");
    setFieldErrors({});

    const payload = {
      id: packagingType?.id,
      ...form,
      width_cm: form.width_cm === "" ? undefined : Number(form.width_cm),
      height_cm: form.height_cm === "" ? undefined : Number(form.height_cm),
      length_cm: form.length_cm === "" ? undefined : Number(form.length_cm),
      empty_weight_kg: Number(form.empty_weight_kg),
      max_weight_kg:
        form.max_weight_kg === "" ? undefined : Number(form.max_weight_kg),
    };

    const result = packagingTypeSchema.safeParse(payload);

    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      setFieldErrors(errors as Record<string, string[]>);
      setGlobalError(
        "Please repair validation error fields found within the component layout.",
      );
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/platform/packaging/types", {
        method: packagingType?.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!data.success) {
        if (data.fields) setFieldErrors(data.fields);
        setGlobalError(
          data.error ||
            "An error occurred while transmitting form mutations to server.",
        );
        return;
      }

      router.push("/platform/packaging/types");
      router.refresh();
    } catch (err) {
      setGlobalError(
        "Connection lost before state adjustments could sync securely.",
      );
    } finally {
      setLoading(false);
    }
  };

  const getInputClass = (fieldName: string) => {
    const base =
      "w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition text-sm ";
    return (
      base +
      (fieldErrors[fieldName]
        ? "border-red-500 focus:ring-red-200"
        : "border-gray-300 focus:border-blue-500")
    );
  };

  return (
    <div className="card p-6 space-y-6">
      {/* HEADER */}

      <div>
        <h2 className="text-xl font-bold text-gray-900">
          {packagingType
            ? "Modify System Packaging Context"
            : "Register Unique Packaging Variant"}
        </h2>
        <p className="text-sm text-gray-500">
          Sync container spatial layout metrics directly to operational system
          rules.
        </p>
      </div>

      {/* ERROR */}

      {globalError && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm font-medium">
          {globalError}
        </div>
      )}

      {/* FORM */}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* NAME */}

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Name
          </label>
          <input
            className={getInputClass("name")}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g., Standard Medium Box"
          />
          {fieldErrors.name && (
            <p className="text-red-500 text-xs mt-1">{fieldErrors.name[0]}</p>
          )}
        </div>

        {/* PACKAGE TYPE */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Package Type
          </label>
          <select
            className={getInputClass("package_type")}
            value={form.package_type}
            onChange={(e) => setForm({ ...form, package_type: e.target.value })}
          >
            <option value="box">Box</option>
            <option value="envelope">Envelope</option>
            <option value="bag">Bag</option>
            <option value="tube">Tube</option>
            <option value="gift_wrap">Gift Wrap</option>
          </select>
          {fieldErrors.package_type && (
            <p className="text-red-500 text-xs mt-1">
              {fieldErrors.package_type[0]}
            </p>
          )}
        </div>

        {/* SKU (With Auto-Generation Toggle Support) */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="block text-sm font-semibold text-gray-700">
              System Inventory SKU
            </label>
            {!packagingType?.id && (
              <button
                type="button"
                onClick={() => setIsManualSku(!isManualSku)}
                className="text-xs text-blue-600 hover:underline font-medium"
              >
                {isManualSku
                  ? "🔗 Switch to Auto SKU"
                  : "✏️ Custom SKU Override"}
              </button>
            )}
          </div>
          <input
            className={
              getInputClass("sku") +
              " uppercase font-mono font-bold bg-gray-50 disabled:text-gray-500"
            }
            value={form.sku}
            onChange={(e) =>
              setForm({ ...form, sku: e.target.value.toUpperCase() })
            }
            placeholder="AUTO-GENERATED"
            disabled={!isManualSku || !!packagingType?.id}
          />
          {fieldErrors.sku && (
            <p className="text-red-500 text-xs mt-1">{fieldErrors.sku[0]}</p>
          )}
        </div>

        {/* MATERIAL */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Material
          </label>
          <select
            className={getInputClass("material")}
            value={form.material}
            onChange={(e) => setForm({ ...form, material: e.target.value })}
          >
            <option value="cardboard">Cardboard</option>
            <option value="plastic">Plastic</option>
            <option value="wood">Wood</option>
            <option value="paper">Paper</option>
          </select>
        </div>

        {/* COLOR */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Color Aesthetics
          </label>
          <input
            className={getInputClass("color")}
            value={form.color}
            onChange={(e) => setForm({ ...form, color: e.target.value })}
            placeholder="e.g., Kraft Brown / Matte Black"
          />
        </div>

        {/* EMPTY WEIGHT */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Tare/Empty Weight (kg)
          </label>
          <input
            type="number"
            step="0.001"
            className={getInputClass("empty_weight_kg")}
            value={form.empty_weight_kg}
            onChange={(e) =>
              setForm({
                ...form,
                empty_weight_kg:
                  e.target.value === "" ? "" : Number(e.target.value),
              })
            }
          />
          {fieldErrors.empty_weight_kg && (
            <p className="text-red-500 text-xs mt-1">
              {fieldErrors.empty_weight_kg[0]}
            </p>
          )}
        </div>

        {/* MAXIMUM LOAD CAPACITY WEIGHT */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Max Weight Threshold Limit (kg)
          </label>
          <input
            type="number"
            step="0.01"
            className={getInputClass("max_weight_kg")}
            value={form.max_weight_kg}
            onChange={(e) =>
              setForm({
                ...form,
                max_weight_kg:
                  e.target.value === "" ? "" : Number(e.target.value),
              })
            }
            placeholder="Optional weight restriction"
          />
          {fieldErrors.max_weight_kg && (
            <p className="text-red-500 text-xs mt-1">
              {fieldErrors.max_weight_kg[0]}
            </p>
          )}
        </div>

        {/* DIMENSIONAL ENTRIES PARTIAL MULTI-GRID */}
        <div className="md:col-span-2 grid grid-cols-3 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
              Length (cm)
            </label>
            <input
              type="number"
              step="0.1"
              className={getInputClass("length_cm")}
              value={form.length_cm}
              onChange={(e) =>
                setForm({
                  ...form,
                  length_cm:
                    e.target.value === "" ? "" : Number(e.target.value),
                })
              }
            />
            {fieldErrors.length_cm && (
              <p className="text-red-500 text-xs mt-1">
                {fieldErrors.length_cm[0]}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
              Width (cm)
            </label>
            <input
              type="number"
              step="0.1"
              className={getInputClass("width_cm")}
              value={form.width_cm}
              onChange={(e) =>
                setForm({
                  ...form,
                  width_cm: e.target.value === "" ? "" : Number(e.target.value),
                })
              }
            />
            {fieldErrors.width_cm && (
              <p className="text-red-500 text-xs mt-1">
                {fieldErrors.width_cm[0]}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
              Height (cm)
            </label>
            <input
              type="number"
              step="0.1"
              className={getInputClass("height_cm")}
              value={form.height_cm}
              onChange={(e) =>
                setForm({
                  ...form,
                  height_cm:
                    e.target.value === "" ? "" : Number(e.target.value),
                })
              }
            />
            {fieldErrors.height_cm && (
              <p className="text-red-500 text-xs mt-1">
                {fieldErrors.height_cm[0]}
              </p>
            )}
          </div>
        </div>

        {/* TEXTAREA DESCRIPTION DESCRIPTION */}
        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Fulfillment Reference Profile Notes
          </label>
          <textarea
            className="w-full border border-gray-300 rounded-lg text-sm min-h-[80px] px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 transition"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Add dynamic system sorting handling details here..."
          />
        </div>
      </div>

      {/* CONDITIONAL HANDLING STATE FLAGS */}
      <div className="flex gap-6 py-3 border-t border-b border-gray-100 bg-gray-50/50 px-4 rounded-xl">
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer select-none">
          <input
            type="checkbox"
            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 transition"
            checked={form.is_fragile}
            onChange={(e) => setForm({ ...form, is_fragile: e.target.checked })}
          />
          Fragile-Safe Structural Profile
        </label>

        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer select-none">
          <input
            type="checkbox"
            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 transition"
            checked={form.is_active}
            onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
          />
          Active Infrastructure Item
        </label>
      </div>

      {/* ACTION */}

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={() => router.push("/platform/packaging/types")}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition shadow-sm"
        >
          {loading ? "Saving..." : "Save Packaging Type"}
        </button>
      </div>
    </div>
  );
}
