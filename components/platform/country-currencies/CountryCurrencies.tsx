// components/platform/country-currencies/CountryCurrencies.tsx

"use client";

import { useEffect, useState } from "react";

type Country = {
  country_id: number;
  country_name: string;
  country_code: string;
  currency_id: string | null;
  currency_code: string | null;
  currency_name: string | null;
};

type Currency = {
  id: string;
  code: string;
  name: string;
};

export default function CountryCurrencies() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form State
  const [form, setForm] = useState({
    country_id: "",
    currency_id: "",
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [countriesRes, currenciesRes] = await Promise.all([
        fetch("/api/country-currencies?shippable=true"),
        fetch("/api/currencies"),
      ]);
      const countriesData = await countriesRes.json();
      const currenciesData = await currenciesRes.json();

      setCountries(countriesData.items || []);
      setCurrencies(currenciesData.items || []);
    } catch (err) {
      console.error("Error loading data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleLink = async () => {
    if (!form.country_id || !form.currency_id) {
      alert("Please select both a country and a currency");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/country-currencies", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          country_id: Number(form.country_id),
          currency_id: form.currency_id,
        }),
      });

      if (res.ok) {
        // Reset only the selected country/currency state
        setForm({ country_id: "", currency_id: "" });
        await fetchData();
      } else {
        alert("Failed to save changes");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-2">Country to Currency Mapping</h2>
          <p className="text-sm text-gray-500 mb-6">Link a localized target currency to customer country destinations.</p>

          {/* Association Interface */}
          <div className="bg-white p-4 rounded shadow mb-6 border border-gray-100 flex flex-wrap gap-4 items-end">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-600">Select Country</label>
              <select
                value={form.country_id}
                onChange={(e) => setForm({ ...form, country_id: e.target.value })}
                className="border p-2 rounded text-sm w-64"
              >
                <option value="">-- Choose Country --</option>
                {countries.map((c) => (
                  <option key={c.country_id} value={c.country_id}>
                    {c.country_name} ({c.country_code})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-600">Choose Linked Currency</label>
              <select
                value={form.currency_id}
                onChange={(e) => setForm({ ...form, currency_id: e.target.value })}
                className="border p-2 rounded text-sm w-64"
              >
                <option value="">-- Choose Currency --</option>
                {currencies.map((cur) => (
                  <option key={cur.id} value={cur.id}>
                    {cur.code} - {cur.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleLink}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-6 py-2.5 rounded transition disabled:opacity-50"
            >
              {saving ? "Linking..." : "Link Currency"}
            </button>
          </div>

          {/* List Table */}
          {loading ? (
            <p className="text-center text-sm text-gray-500 py-10">Loading configurations...</p>
          ) : (
            <div className="bg-white rounded shadow overflow-hidden">
              <table className="w-full table-auto">
                <thead>
                  <tr className="bg-gray-50 text-left text-xs font-bold text-gray-500 uppercase border-b">
                    <th className="p-4">Country</th>
                    <th className="p-4">ISO Code</th>
                    <th className="p-4">Linked Currency</th>
                    <th className="p-4">Currency Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {countries.map((c) => (
                    <tr key={c.country_id} className="hover:bg-gray-50/50 transition">
                      <td className="p-4 font-medium">{c.country_name}</td>
                      <td className="p-4 text-gray-500">{c.country_code}</td>
                      <td className="p-4">
                        {c.currency_code ? (
                          <span className="font-semibold text-blue-600">{c.currency_code} ({c.currency_name})</span>
                        ) : (
                          <span className="text-gray-400 italic">No custom currency mapped</span>
                        )}
                      </td>
                      <td className="p-4">
                        {c.currency_id ? (
                          <span className="bg-green-100 text-green-700 text-xs px-2.5 py-1 rounded-full font-medium">Mapped</span>
                        ) : (
                          <span className="bg-amber-100 text-amber-700 text-xs px-2.5 py-1 rounded-full font-medium">Fallback Active</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}