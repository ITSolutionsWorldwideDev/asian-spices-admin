// apps/admin/components/shipping/store/StoreRatesClient.tsx

"use client";

import { useEffect, useState } from "react";

type Rate = {
  id?: string;
  method_id?: string;
  country: string;
  city?: string;
  min_weight: number;
  max_weight: number;
  price: number;
};

export default function StoreRatesClient({
  storeId,
  methods,
  rates,
  countries,
}: {
  storeId: string;
  methods: any[];
  rates: Rate[];
  countries: any[];
}) {
  const [rows, setRows] = useState<Rate[]>([]);
  const [saving, setSaving] = useState(false);

  // -----------------------------
  // INIT DATA
  // -----------------------------
  useEffect(() => {
    const formatted = rates.map((r) => ({
      ...r,
      min_weight: Number(r.min_weight ?? 0),
      max_weight: Number(r.max_weight ?? 0),
      price: Number(r.price ?? 0),
    }));

    setRows(formatted);
  }, [rates]);

  // -----------------------------
  // ADD ROW
  // -----------------------------
  const addRow = (methodId?: string) => {
    setRows((prev) => [
      ...prev,
      {
        method_id: methodId,
        country: "NL", // default Netherlands
        city: "",
        min_weight: 0,
        max_weight: 0,
        price: 0,
      },
    ]);
  };

  // -----------------------------
  // UPDATE ROW
  // -----------------------------
  const updateRow = (index: number, key: keyof Rate, value: any) => {
    setRows((prev) => {
      const copy = [...prev];

      copy[index] = {
        ...copy[index],
        [key]:
          key === "min_weight" ||
          key === "max_weight" ||
          key === "price"
            ? Number(value)
            : value,
      };

      return copy;
    });
  };

  // -----------------------------
  // DELETE ROW
  // -----------------------------
  const removeRow = (index: number) => {
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  // -----------------------------
  // SAVE BULK
  // -----------------------------
  const handleSave = async () => {
    setSaving(true);

    try {
      const res = await fetch(
        "/api/platform/shipping/rates/bulk",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            storeId,
            rates: rows,
          }),
        }
      );

      const data = await res.json();

      if (!data.success) {
        alert("Failed to save rates");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // -----------------------------
  // GROUP BY METHOD
  // -----------------------------
  const grouped = methods.map((m) => ({
    method: m,
    rows: rows.filter((r) => r.method_id === m.id),
  }));

  // -----------------------------
  // UI
  // -----------------------------
  return (
    <div className="space-y-8">
      {grouped.map((group) => (
        <div key={group.method.id} className="border rounded-xl p-4">
          {/* Header */}
          <div className="flex justify-between items-center mb-3">
            <div>
              <h3 className="font-semibold">
                {group.method.name}
              </h3>
              <p className="text-xs text-gray-500">
                {group.method.provider_name}
              </p>
            </div>

            <button
              onClick={() => addRow(group.method.id)}
              className="btn btn-sm btn-secondary"
            >
              + Add Rate
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm border">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-2 text-left">Country</th>
                  <th className="p-2 text-left">City</th>
                  <th className="p-2">Min</th>
                  <th className="p-2">Max</th>
                  <th className="p-2">Price</th>
                  <th className="p-2"></th>
                </tr>
              </thead>

              <tbody>
                {group.rows.map((r, i) => {
                  const index = rows.indexOf(r);

                  return (
                    <tr key={i} className="border-t">
                      {/* COUNTRY DROPDOWN */}
                      <td className="p-2">
                        <select
                          value={r.country}
                          onChange={(e) =>
                            updateRow(index, "country", e.target.value)
                          }
                          className="input w-full"
                        >
                          {countries.map((c: any) => (
                            <option
                              key={c.country_code}
                              value={c.country_code}
                            >
                              {c.country_name}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* CITY */}
                      <td className="p-2">
                        <input
                          value={r.city || ""}
                          onChange={(e) =>
                            updateRow(index, "city", e.target.value)
                          }
                          className="input w-full"
                        />
                      </td>

                      {/* MIN */}
                      <td className="p-2">
                        <input
                          type="number"
                          value={r.min_weight}
                          onChange={(e) =>
                            updateRow(
                              index,
                              "min_weight",
                              e.target.value
                            )
                          }
                          className="input w-20"
                        />
                      </td>

                      {/* MAX */}
                      <td className="p-2">
                        <input
                          type="number"
                          value={r.max_weight}
                          onChange={(e) =>
                            updateRow(
                              index,
                              "max_weight",
                              e.target.value
                            )
                          }
                          className="input w-20"
                        />
                      </td>

                      {/* PRICE */}
                      <td className="p-2">
                        <input
                          type="number"
                          value={r.price}
                          onChange={(e) =>
                            updateRow(index, "price", e.target.value)
                          }
                          className="input w-24"
                        />
                      </td>

                      {/* DELETE */}
                      <td className="p-2 text-right">
                        <button
                          onClick={() => removeRow(index)}
                          className="text-red-500 text-xs"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {group.rows.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="text-center text-gray-400 p-4"
                    >
                      No rates for this method
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {/* SAVE BUTTON */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn btn-primary"
        >
          {saving ? "Saving..." : "Save All Rates"}
        </button>
      </div>
    </div>
  );
}