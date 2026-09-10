//  components/platform/currencies/CurrencyList.tsx

"use client";

import { useEffect, useState } from "react";

type Currency = {
  id: string;
  code: string;
  name: string;
  symbol: string;
  status?: boolean;
};

export default function CurrencyListComponent() {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [form, setForm] = useState({
    code: "",
    name: "",
    symbol: "",
  });

  // Load from currencies table only (no auto-sync)
  const loadCurrencies = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/currencies");
      const data = await res.json();
      setCurrencies(data.items || []);
    } finally {
      setLoading(false);
    }
  };

  // Sync from shippable countries into currencies, then reload list
  const fetchFromShippableCountries = async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/currencies?shippable=true");
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch currencies");
      }
      setCurrencies(data.items || []);
    } catch (err: any) {
      alert(err.message || "Failed to fetch currencies");
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    loadCurrencies();
  }, []);

  const createCurrency = async () => {
    await fetch("/api/currencies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setForm({ code: "", name: "", symbol: "" });
    loadCurrencies();
  };

  const deleteCurrency = async (id: string) => {
    await fetch(`/api/currencies/${id}`, {
      method: "DELETE",
    });

    loadCurrencies();
  };

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="p-6">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <h2 className="text-xl">Currencies</h2>
            <div className="text-right">
              <button
                onClick={fetchFromShippableCountries}
                disabled={syncing}
                className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
              >
                {syncing ? "Fetching..." : "Fetch new currencies"}
              </button>
              <p className="mt-2 max-w-xs text-xs text-gray-500">
                On clicking this, all currencies from countries where we are
                able to ship will come.
              </p>
            </div>
          </div>

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
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : currencies.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-gray-500">
                    No currencies yet. Click &quot;Fetch new currencies&quot; or
                    add one manually.
                  </td>
                </tr>
              ) : (
                currencies.map((c, index) => (
                  <tr
                    key={c.id || c.code || `currency-${index}`}
                    className="hover:bg-gray-50/50 transition"
                  >
                    <td className="px-6 py-2">{c.code}</td>
                    <td className="px-6 py-2">{c.name}</td>
                    <td className="px-6 py-2">{c.symbol}</td>
                    <td className="px-6 py-2">
                      {c.id ? (
                        <button
                          onClick={() => deleteCurrency(c.id)}
                          className="text-red-500"
                        >
                          Delete
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
