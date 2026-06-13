// apps/admin/app/platform/packaging/packages/new/PackageForm.tsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Package = {
  id?: string;
  name?: string;
  code?: string;

  package_type?: string;

  width_cm?: number;
  height_cm?: number;
  length_cm?: number;

  weight_limit_kg?: number;

  ribbon_color?: string;

  is_active?: boolean;
};

export default function PackageForm({
  packageData,
}: {
  packageData?: Package;
}) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: packageData?.name || "",
    code: packageData?.code || "",

    package_type:
      packageData?.package_type || "box",

    width_cm:
      packageData?.width_cm || 0,

    height_cm:
      packageData?.height_cm || 0,

    length_cm:
      packageData?.length_cm || 0,

    weight_limit_kg:
      packageData?.weight_limit_kg || 0,

    ribbon_color:
      packageData?.ribbon_color || "",

    is_active:
      packageData?.is_active ?? true,
  });

  const handleSubmit = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(
        "/api/platform/packaging/packages",
        {
          method: packageData?.id
            ? "PUT"
            : "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            id: packageData?.id,
            ...form,
          }),
        },
      );

      const data = await res.json();

      if (!data.success) {
        setError(
          data.error ||
            "Failed to save package",
        );

        return;
      }

      router.push(
        "/platform/packaging/packages",
      );
    } catch (err) {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-6 space-y-6">
      <div>
        <h2 className="text-xl font-semibold">
          {packageData
            ? "Edit Package"
            : "Create Package"}
        </h2>

        <p className="text-sm text-gray-500">
          Manage packaging templates
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="label">
            Package Name
          </label>

          <input
            className="input"
            value={form.name}
            onChange={(e) =>
              setForm({
                ...form,
                name: e.target.value,
              })
            }
          />
        </div>

        <div>
          <label className="label">
            Package Code
          </label>

          <input
            className="input"
            value={form.code}
            onChange={(e) =>
              setForm({
                ...form,
                code: e.target.value,
              })
            }
          />
        </div>

        <div>
          <label className="label">
            Package Type
          </label>

          <select
            className="input"
            value={form.package_type}
            onChange={(e) =>
              setForm({
                ...form,
                package_type:
                  e.target.value,
              })
            }
          >
            <option value="box">
              Box
            </option>

            <option value="bag">
              Bag
            </option>

            <option value="gift_wrap">
              Gift Wrap
            </option>
          </select>
        </div>

        <div>
          <label className="label">
            Ribbon Color
          </label>

          <input
            className="input"
            value={form.ribbon_color}
            onChange={(e) =>
              setForm({
                ...form,
                ribbon_color:
                  e.target.value,
              })
            }
          />
        </div>

        <div>
          <label className="label">
            Width (cm)
          </label>

          <input
            type="number"
            className="input"
            value={form.width_cm}
            onChange={(e) =>
              setForm({
                ...form,
                width_cm: Number(
                  e.target.value,
                ),
              })
            }
          />
        </div>

        <div>
          <label className="label">
            Height (cm)
          </label>

          <input
            type="number"
            className="input"
            value={form.height_cm}
            onChange={(e) =>
              setForm({
                ...form,
                height_cm: Number(
                  e.target.value,
                ),
              })
            }
          />
        </div>

        <div>
          <label className="label">
            Length (cm)
          </label>

          <input
            type="number"
            className="input"
            value={form.length_cm}
            onChange={(e) =>
              setForm({
                ...form,
                length_cm: Number(
                  e.target.value,
                ),
              })
            }
          />
        </div>

        <div>
          <label className="label">
            Weight Limit (kg)
          </label>

          <input
            type="number"
            className="input"
            value={form.weight_limit_kg}
            onChange={(e) =>
              setForm({
                ...form,
                weight_limit_kg:
                  Number(
                    e.target.value,
                  ),
              })
            }
          />
        </div>
      </div>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={form.is_active}
          onChange={(e) =>
            setForm({
              ...form,
              is_active:
                e.target.checked,
            })
          }
        />

        Active
      </label>

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="btn btn-primary"
      >
        {loading
          ? "Saving..."
          : "Save Package"}
      </button>
    </div>
  );
}