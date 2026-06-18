// /components/platform/currency-rates/CurrencyRates.tsx

"use client";

import { useEffect, useState } from "react";

type Rate = {
  id: string;
  base_currency_code: string;
  target_currency_code: string;
  rate: number;
};

type Currency = {
  code: string;
  name: string;
};

export default function CurrencyRates() {
  const [rates, setRates] = useState<Rate[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [form, setForm] = useState({
    base_currency_code: "",
    target_currency_code: "",
    rate: 1,
  });

  const fetchRates = async () => {
    const res = await fetch("/api/currency-rates");
    const data = await res.json();
    setRates(data.items || []);
  };

  const fetchCurrencies = async () => {
    const res = await fetch("/api/currencies");
    const data = await res.json();
    setCurrencies(data.items || []);
  };

  useEffect(() => {
    fetchRates();
    fetchCurrencies();
  }, []);

  const saveRate = async () => {
    if (form.base_currency_code === form.target_currency_code) {
      alert("Base and target currency cannot be same");
      return;
    }
    await fetch("/api/currency-rates", {
      method: "POST",
      body: JSON.stringify(form),
    });
    setForm({ base_currency_code: "", target_currency_code: "", rate: 1 });
    fetchRates();
  };

  const deleteRate = async (id: string) => {
    await fetch(`/api/currency-rates/${id}`, { method: "DELETE" });
    fetchRates();
  };

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="p-6">
          <h2 className="text-xl mb-4">Currency Exchange Rates</h2>

          {/* CREATE */}
          <div className="flex gap-2 mb-4">
            <select
              value={form.base_currency_code}
              onChange={(e) =>
                setForm({ ...form, base_currency_code: e.target.value })
              }
              className="border p-2"
            >
              <option value="">Base Currency</option>
              {currencies.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code}
                </option>
              ))}
            </select>

            <select
              value={form.target_currency_code}
              onChange={(e) =>
                setForm({ ...form, target_currency_code: e.target.value })
              }
              className="border p-2"
            >
              <option value="">Target Currency</option>
              {currencies.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code}
                </option>
              ))}
            </select>

            <input
              type="number"
              value={form.rate}
              onChange={(e) =>
                setForm({ ...form, rate: Number(e.target.value) })
              }
              placeholder="Rate"
              className="border p-2 w-24"
            />

            <button onClick={saveRate} className="bg-blue-600 text-white px-4">
              Save
            </button>
          </div>

          {/* LIST */}

          <table className="w-full table-auto bg-white rounded shadow">
            <thead>
              <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b">
                <th className="p-4">Base</th>
                <th className="p-4">Target</th>
                <th className="p-4">Rate</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rates.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50/50 transition">
                  <td className="px-6 py-2">{r.base_currency_code}</td>
                  <td className="px-6 py-2">{r.target_currency_code}</td>
                  <td className="px-6 py-2">{r.rate}</td>
                  <td className="px-6 py-2">
                    <button
                      onClick={() => deleteRate(r.id)}
                      className="text-red-500"
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
    </div>
  );
}
