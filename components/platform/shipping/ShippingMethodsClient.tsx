// components/platform/shipping/ShippingMethodsClient.tsx

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import CreateShippingMethodForm from "./CreateShippingMethodForm";
import Modal from "./Modal";
import Link from "next/link";
import RatesManager from "./RatesManager";

export default function ShippingMethodsClient({
  methods,
  providers,
  total,
  page,
  pageSize,
  search,
}: any) {
  const router = useRouter();
  const [query, setQuery] = useState(search || "");
  const [editing, setEditing] = useState<any | null>(null);
  const [deleting, setDeleting] = useState<any | null>(null);
  const [pending, startTransition] = useTransition();

  const [ratesMethod, setRatesMethod] = useState<any | null>(null);

  const totalPages = Math.ceil(total / pageSize);

  // -----------------------
  // search
  // -----------------------
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`?q=${query}&page=1`);
  };

  // -----------------------
  // delete
  // -----------------------
  const handleDelete = () => {
    if (!deleting) return;

    startTransition(async () => {
      await fetch(`/api/platform/shipping/shipping-methods/${deleting.id}`, {
        method: "DELETE",
      });

      setDeleting(null);
      router.refresh();
    });
  };

  // -----------------------
  // toggle active
  // -----------------------
  const toggleActive = (method: any) => {
    startTransition(async () => {
      await fetch(`/api/platform/shipping/shipping-methods/${method.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          is_active: !method.is_active,
        }),
      });

      router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <button onClick={() => setEditing({})} className="btn btn-primary">
          + Add Method
        </button>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search methods..."
          className="border px-3 py-2 rounded w-full"
        />
        <button className="btn btn-secondary">Search</button>
      </form>

      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Code</th>
              <th className="p-3">Provider</th>
              <th className="p-3">Type</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>

          <tbody>
            {methods.map((m: any) => (
              <tr key={m.id} className="border-t">
                <td className="p-3 font-medium">{m.name}</td>
                <td className="p-3 font-mono text-xs">{m.code}</td>
                <td className="p-3">{m.provider_name}</td>
                <td className="p-3">{m.type}</td>

                <td className="p-3">
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      m.is_active
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {m.is_active ? "Active" : "Inactive"}
                  </span>
                </td>

                <td className="p-3 text-right space-x-2">
                  <button
                    onClick={async () => {
                      const res = await fetch(
                        `/api/platform/shipping/shipping-rates?methodId=${m.id}`,
                      );
                      const data = await res.json();
                      setRatesMethod({
                        ...m,
                        rates: data.rates || [],
                      });
                    }}
                    className="btn btn-sm btn-secondary"
                  >
                    Rates
                  </button>

                  <button
                    onClick={() => setEditing(m)}
                    className="text-xs text-yellow-600"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => setDeleting(m)}
                    className="text-xs text-red-600"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-500">
          Page {page} of {totalPages}
        </span>

        <div className="flex gap-2">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => router.push(`?page=${i + 1}&q=${query}`)}
              className={`px-3 py-1 rounded ${
                page === i + 1 ? "bg-blue-500 text-white" : "bg-gray-200"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>

      {editing !== null && (
        <Modal onClose={() => setEditing(null)}>
          <CreateShippingMethodForm
            method={editing?.id ? editing : undefined}
            providers={providers}
          />
        </Modal>
      )}

      {deleting && (
        <Modal onClose={() => setDeleting(null)}>
          <div className="p-4 space-y-4">
            <h3 className="font-bold">Delete Method</h3>
            <p>Are you sure you want to delete this method?</p>

            <div className="flex justify-end gap-2">
              <button onClick={() => setDeleting(null)} className="btn">
                Cancel
              </button>

              <button onClick={handleDelete} className="btn btn-danger">
                Confirm Delete
              </button>
            </div>
          </div>
        </Modal>
      )}

      {ratesMethod && (
        <Modal onClose={() => setRatesMethod(null)}>
          <div className="p-4 space-y-4 w-[700px] max-w-full">
            <div>
              <h3 className="text-lg font-semibold">Manage Rates</h3>
              <p className="text-sm text-gray-500">
                {ratesMethod.name} ({ratesMethod.provider_name})
              </p>
            </div>

            <RatesManager
              methodId={ratesMethod.id}
              initialRates={ratesMethod.rates}
            />

            <div className="flex justify-end">
              <button onClick={() => setRatesMethod(null)} className="btn">
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
