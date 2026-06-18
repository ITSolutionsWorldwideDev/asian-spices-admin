// components/customers/CustomerForm.tsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type CustomerType = "B2C" | "B2B";

type Customer = {
  id?: string;
  customer_type: CustomerType;
  company_name?: string;
  tax_id?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  credit_limit?: number;
  payment_terms?: number;
};

type Props = {
  initialData?: Customer;
  onSaved?: () => void;
};

export default function CustomerForm({ initialData, onSaved }: Props) {
  const router = useRouter();

  const [form, setForm] = useState({
    customer_type: initialData?.customer_type || "B2C",
    company_name: initialData?.company_name || "",
    tax_id: initialData?.tax_id || "",
    first_name: initialData?.first_name || "",
    last_name: initialData?.last_name || "",
    email: initialData?.email || "",
    phone: initialData?.phone || "",
    credit_limit: initialData?.credit_limit || 0,
    payment_terms: initialData?.payment_terms || 0,
  });

  const update = (key: string, value: any) => {
    setForm({ ...form, [key]: value });
  };

//   const updateAddress = (key: string, value: any) => {
//     setForm({
//       ...form,
//       address: { ...form.address, [key]: value },
//     });
//   };

  const submit = async () => {
    const method = initialData?.id ? "PUT" : "POST";
    const url = initialData?.id
      ? `/api/customers/${initialData.id}`
      : `/api/customers`;

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (!res.ok) {
      alert("Failed to save customer");
      return;
    }

    if (onSaved) {
      onSaved();
    } else {
      router.push("/customers");
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">

      <select
        value={form.customer_type}
        onChange={(e) =>
          update("customer_type", e.target.value as CustomerType)
        }
        className="border p-2 w-full"
      >
        <option value="B2C">B2C</option>
        <option value="B2B">B2B</option>
      </select>

      {/* B2B Fields */}
      {form.customer_type === "B2B" && (
        <>
          <input
            placeholder="Company Name"
            value={form.company_name}
            onChange={(e) => update("company_name", e.target.value)}
            className="border p-2 w-full"
          />

          <input
            placeholder="Tax ID"
            value={form.tax_id}
            onChange={(e) => update("tax_id", e.target.value)}
            className="border p-2 w-full"
          />

          <input
            type="number"
            placeholder="Credit Limit"
            value={form.credit_limit}
            onChange={(e) => update("credit_limit", e.target.value)}
            className="border p-2 w-full"
          />

          <input
            type="number"
            placeholder="Payment Terms (days)"
            value={form.payment_terms}
            onChange={(e) => update("payment_terms", e.target.value)}
            className="border p-2 w-full"
          />
        </>
      )}

      {/* Common Fields */}
      <input
        placeholder="First Name"
        value={form.first_name}
        onChange={(e) => update("first_name", e.target.value)}
        className="border p-2 w-full"
      />

      <input
        placeholder="Last Name"
        value={form.last_name}
        onChange={(e) => update("last_name", e.target.value)}
        className="border p-2 w-full"
      />

      <input
        placeholder="Email"
        value={form.email}
        onChange={(e) => update("email", e.target.value)}
        className="border p-2 w-full"
      />

      <input
        placeholder="Phone"
        value={form.phone}
        onChange={(e) => update("phone", e.target.value)}
        className="border p-2 w-full"
      />

      <button
        onClick={submit}
        className="bg-black text-white px-6 py-2 rounded"
      >
        {initialData?.id ? "Update Customer" : "Create Customer"}
      </button>
    </div>
  );
}