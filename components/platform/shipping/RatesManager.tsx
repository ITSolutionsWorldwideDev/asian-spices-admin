// components/platform/shipping/RatesManager.tsx

"use client";

import { useEffect, useState } from "react";

type Rate = {
  id?: string;
  country?: string;
  city?: string;
  min_weight?: number | "";
  max_weight?: number | "";
  price?: number | "";
  min_delivery_days?: number | "";
  max_delivery_days?: number | "";
};
type Countries = {
  id: number;
  name: string;
  iso2: string;
};

export default function RatesManager({
  methodId,
  initialRates = [],
}: {
  methodId: string;
  initialRates?: Rate[];
}) {
  const [rates, setRates] = useState<Rate[]>(initialRates || []);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [countries, setCountries] = useState<Countries[]>([]);

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const res = await fetch("/api/countries");
        const data = await res.json();

        setCountries(data);
      } catch (err) {
        console.error("Failed to load countries", err);
      }
    };

    fetchCountries();
  }, []);

  // ---------------------------
  // Fetch rates
  // ---------------------------
  const fetchRates = async () => {
    try {
      setLoading(true);

      const res = await fetch(
        `/api/platform/shipping/shipping-rates?methodId=${methodId}`,
      );

      const data = await res.json();

      if (!data.success) throw new Error(data.error);

      setRates(data.rates || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------
  // Load on mount
  // ---------------------------
  useEffect(() => {
    if (initialRates.length === 0) {
      fetchRates();
    }
  }, [methodId]);

  const addRow = () => {
    setRates((prev) => [
      ...prev,
      {
        country: "NL",
        city: "",
        min_weight: "",
        max_weight: "",
        price: "",
        min_delivery_days: 3,
        max_delivery_days: 7,
      },
    ]);
  };

  const updateRow = (index: number, field: string, value: any) => {
    setRates((prev) =>
      prev.map((r, i) =>
        i === index
          ? {
              ...r,
              [field]:
                field === "price" ||
                field === "min_weight" ||
                field === "max_weight" ||
                field === "min_delivery_days" ||
                field === "max_delivery_days"
                  ? value === ""
                    ? ""
                    : Number(value)
                  : value,
            }
          : r,
      ),
    );
  };

  const removeRow = (index: number) => {
    setRates(rates.filter((_, i) => i !== index));
  };

  // ---------------------------
  // Save
  // ---------------------------
  const handleSave = async () => {
    try {
      setSaving(true);
      setError("");

      const res = await fetch("/api/platform/shipping/shipping-rates/bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          methodId,
          rates,
        }),
      });

      const data = await res.json();

      if (!data.success) throw new Error(data.error);

      // alert("Rates saved successfully");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // ---------------------------
  // UI (Improved)
  // ---------------------------

  return (
    <div className="w-full space-y-4">
      {error && (
        <div className="text-red-600 text-sm bg-red-50 border border-red-200 p-3 rounded-lg">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-24 space-x-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black" />
          <p className="text-gray-500 font-medium">Loading...</p>
        </div>
      ) : (
        <>
          <div className="w-full border border-gray-200 rounded-xl bg-white shadow-xs overflow-hidden">
            <div className="max-h-[550px] overflow-y-auto overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead className="bg-gray-50 text-gray-600 text-xs font-semibold uppercase border-b border-gray-200 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3 w-12 text-center">#</th>
                    <th className="px-4 py-3 w-44">Country</th>
                    <th className="px-4 py-3">City (Optional)</th>
                    <th className="px-4 py-3 w-32">Min Wt (kg)</th>
                    <th className="px-4 py-3 w-32">Max Wt (kg)</th>
                    <th className="px-4 py-3 w-32">Price (€)</th>
                    <th className="px-4 py-3 w-28">Min Days</th>
                    <th className="px-4 py-3 w-28">Max Days</th>
                    <th className="px-4 py-3 w-20 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                  {rates.map((r, i) => (
                    <tr
                      key={i}
                      className="hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-4 py-2 text-center text-gray-400 font-medium">
                        {i + 1}
                      </td>

                      <td className="px-2 py-2">
                        <select
                          value={r.country || (countries[0]?.iso2 ?? "NL")}
                          onChange={(e) =>
                            updateRow(i, "country", e.target.value)
                          }
                          className="w-full px-2 py-1.5 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                        >
                          {countries?.map((c) => (
                            <option key={c.id} value={c.iso2}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="px-2 py-2">
                        <input
                          value={r.city || ""}
                          onChange={(e) => updateRow(i, "city", e.target.value)}
                          placeholder="e.g. Amsterdam"
                          className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                        />
                      </td>

                      <td className="px-2 py-2">
                        <input
                          type="number"
                          step="0.01"
                          value={r.min_weight ?? ""}
                          onChange={(e) =>
                            updateRow(i, "min_weight", e.target.value)
                          }
                          className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                        />
                      </td>

                      <td className="px-2 py-2">
                        <input
                          type="number"
                          step="0.01"
                          value={r.max_weight ?? ""}
                          onChange={(e) =>
                            updateRow(i, "max_weight", e.target.value)
                          }
                          className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                        />
                      </td>

                      <td className="px-2 py-2">
                        <input
                          type="number"
                          step="0.01"
                          value={r.price ?? ""}
                          onChange={(e) =>
                            updateRow(i, "price", e.target.value)
                          }
                          className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm font-medium"
                        />
                      </td>

                      <td className="px-2 py-2">
                        <input
                          type="number"
                          value={r.min_delivery_days ?? ""}
                          onChange={(e) =>
                            updateRow(i, "min_delivery_days", e.target.value)
                          }
                          className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                        />
                      </td>

                      <td className="px-2 py-2">
                        <input
                          type="number"
                          value={r.max_delivery_days ?? ""}
                          onChange={(e) =>
                            updateRow(i, "max_delivery_days", e.target.value)
                          }
                          className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                        />
                      </td>

                      <td className="px-4 py-2 text-center">
                        <button
                          onClick={() => removeRow(i)}
                          className="text-red-500 hover:text-red-700 font-medium text-xs p-1 rounded hover:bg-red-50 transition"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {rates.length === 0 && (
              <div className="text-center text-gray-400 py-12 bg-white">
                No shipping configuration rates active.
              </div>
            )}
          </div>

          <div className="flex justify-between items-center border-t border-gray-100 pt-4">
            <button
              onClick={addRow}
              className="px-4 py-2 text-sm border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 font-medium rounded-lg shadow-2xs transition"
            >
              + Add New Rate Row
            </button>

            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 font-medium rounded-lg shadow-2xs transition"
            >
              {saving ? "Saving Configurations..." : "Save Configured Rates"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
