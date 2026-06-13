//  apps/admin/components/platform/currencies/CurrencyList.tsx

"use client";

import { useEffect, useState } from "react";

type Currency = {
  id: string;
  code: string;
  name: string;
  symbol: string;
  status: boolean;
};

export default function CurrencyListComponent() {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [form, setForm] = useState({
    code: "",
    name: "",
    symbol: "",
  });

  const fetchCurrencies = async () => {
    const res = await fetch("/api/currencies");
    const data = await res.json();
    setCurrencies(data.items || []);
  };

  useEffect(() => {
    fetchCurrencies();
  }, []);

  const createCurrency = async () => {
    await fetch("/api/currencies", {
      method: "POST",
      body: JSON.stringify(form),
    });

    setForm({ code: "", name: "", symbol: "" });
    fetchCurrencies();
  };

  const deleteCurrency = async (id: string) => {
    await fetch(`/api/currencies/${id}`, {
      method: "DELETE",
    });

    fetchCurrencies();
  };

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="p-6">
          <h2 className="text-xl mb-4">Currencies</h2>

          {/* CREATE */}
          <div className="flex gap-2 mb-4">
            <input
              placeholder="Code (USD)"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              className="border p-2"
            />
            <input
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="border p-2"
            />
            <input
              placeholder="Symbol ($)"
              value={form.symbol}
              onChange={(e) => setForm({ ...form, symbol: e.target.value })}
              className="border p-2"
            />

            <button
              onClick={createCurrency}
              className="bg-blue-600 text-white px-4"
            >
              Add
            </button>
          </div>

          {/* LIST */}

          <table className="w-full table-auto bg-white rounded shadow">
            <thead>
              <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b">
                <th className="p-4 ">Code</th>
                <th className="p-4 ">Name</th>
                <th className="p-4 ">Symbol</th>
                <th className="p-4 "></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {currencies.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50/50 transition">
                  <td className="px-6 py-2">{c.code}</td>
                  <td className="px-6 py-2">{c.name}</td>
                  <td className="px-6 py-2">{c.symbol}</td>
                  <td className="px-6 py-2">
                    <button
                      onClick={() => deleteCurrency(c.id)}
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
