// apps/admin/components/customers/AddressManager.tsx

"use client";

import { useState } from "react";

type Address = {
  id?: string;
  label: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state?: string;
  postal_code?: string;
  country: string;
  is_default?: boolean;
};

export default function AddressManager({
  customerId,
  addresses: initialAddresses,
  onUpdate,
}: {
  customerId: string;
  addresses: Address[];
  onUpdate: () => void;
}) {
  const [addresses, setAddresses] = useState<Address[]>(initialAddresses);
  const [editing, setEditing] = useState<Address | null>(null);

  const saveAddress = async (addr: Address) => {
    const method = addr.id ? "PUT" : "POST";
    const url = addr.id
      ? `/api/customers/${customerId}/addresses/${addr.id}`
      : `/api/customers/${customerId}/addresses`;

    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(addr),
    });

    setEditing(null);
    onUpdate();
  };

  const deleteAddress = async (id: string) => {
    if (!confirm("Delete this address?")) return;

    await fetch(`/api/customers/${customerId}/addresses/${id}`, {
      method: "DELETE",
    });

    onUpdate();
  };

  return (
    <div className="space-y-4">
      {addresses?.map((a) => (
        <div key={a.id} className="flex justify-between items-center border p-2">
          <div>
            <strong>{a.label}</strong>: {a.address_line1}, {a.city}, {a.country}{" "}
            {a.is_default && "(Default)"}
          </div>
          <div className="space-x-2">
            <button onClick={() => setEditing(a)} className="text-blue-500">
              Edit
            </button>
            <button onClick={() => deleteAddress(a.id!)} className="text-red-500">
              Delete
            </button>
          </div>
        </div>
      ))}

      {editing ? (
        <AddressForm
          address={editing}
          onCancel={() => setEditing(null)}
          onSave={saveAddress}
        />
      ) : (
        <button
          className="bg-green-500 text-white px-4 py-2 rounded"
          onClick={() =>
            setEditing({
              label: "Home",
              address_line1: "",
              city: "",
              country: "",
              is_default: false,
            })
          }
        >
          Add Address
        </button>
      )}
    </div>
  );
}

// Address Form Component
function AddressForm({
  address,
  onCancel,
  onSave,
}: {
  address: Address;
  onCancel: () => void;
  onSave: (a: Address) => void;
}) {
  const [form, setForm] = useState(address);

  const update = (key: string, value: string | boolean) => {
    setForm({ ...form, [key]: value });
  };

  return (
    <div className="border p-4 space-y-2">
      <input
        placeholder="Label"
        value={form.label}
        onChange={(e) => update("label", e.target.value)}
        className="border p-2 w-full"
      />
      <input
        placeholder="Address Line 1"
        value={form.address_line1}
        onChange={(e) => update("address_line1", e.target.value)}
        className="border p-2 w-full"
      />
      <input
        placeholder="Address Line 2"
        value={form.address_line2 || ""}
        onChange={(e) => update("address_line2", e.target.value)}
        className="border p-2 w-full"
      />
      <input
        placeholder="City"
        value={form.city}
        onChange={(e) => update("city", e.target.value)}
        className="border p-2 w-full"
      />
      <input
        placeholder="State"
        value={form.state || ""}
        onChange={(e) => update("state", e.target.value)}
        className="border p-2 w-full"
      />
      <input
        placeholder="Postal Code"
        value={form.postal_code || ""}
        onChange={(e) => update("postal_code", e.target.value)}
        className="border p-2 w-full"
      />
      <input
        placeholder="Country"
        value={form.country}
        onChange={(e) => update("country", e.target.value)}
        className="border p-2 w-full"
      />
      <label className="flex items-center space-x-2">
        <input
          type="checkbox"
          checked={form.is_default || false}
          onChange={(e) => update("is_default", e.target.checked)}
        />
        <span>Default</span>
      </label>

      <div className="flex space-x-2 mt-2">
        <button
          onClick={() => onSave(form)}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Save
        </button>
        <button onClick={onCancel} className="bg-gray-300 px-4 py-2 rounded">
          Cancel
        </button>
      </div>
    </div>
  );
}