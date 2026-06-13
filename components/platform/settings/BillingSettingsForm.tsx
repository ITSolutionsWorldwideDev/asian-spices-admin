// apps/admin/components/platform/settings/BillingSettingsForm.tsx

"use client";

import { useState, useTransition } from "react";
import { updatePlatformSetting } from "./actions";
import { useToast } from "@/core/ui";

type Props = {
  initialValues: {
    tax_percentage?: number;
    invoice_prefix?: string;
  };
};

export default function BillingSettingsForm({ initialValues }: Props) {
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [form, setForm] = useState({
    tax_percentage: initialValues.tax_percentage ?? 0,
    invoice_prefix: initialValues.invoice_prefix ?? "INV",
  });

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    startTransition(async () => {
      await updatePlatformSetting("billing", form);
      showToast("success", "Billing settings updated");
    });
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-4 p-6">
      <h2 className="text-lg font-semibold">Billing</h2>

      <input
        type="number"
        className="input w-full form-control"
        placeholder="Tax percentage"
        value={form.tax_percentage}
        onChange={(e) =>
          setForm({ ...form, tax_percentage: Number(e.target.value) })
        }
      />

      <input
        className="input w-full form-control"
        placeholder="Invoice prefix"
        value={form.invoice_prefix}
        onChange={(e) => setForm({ ...form, invoice_prefix: e.target.value })}
      />

      <button className="btn btn-primary" disabled={isPending}>
        Save
      </button>
    </form>
  );
}
