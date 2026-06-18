// components/platform/settings/GeneralSettingsForm.tsx

"use client";

import { useState, useTransition } from "react";
import { updatePlatformSetting } from "./actions";
import { useToast } from "@/core/ui";

type Props = {
  initialValues: {
    platform_name?: string;
    support_email?: string;
    default_currency?: "USD" | "EUR";
  };
};

export default function GeneralSettingsForm({ initialValues }: Props) {
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [form, setForm] = useState({
    platform_name: initialValues.platform_name ?? "",
    support_email: initialValues.support_email ?? "",
    default_currency: initialValues.default_currency ?? "USD",
  });

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    startTransition(async () => {
      await updatePlatformSetting("general", form);
      showToast("success", "General settings updated");
    });
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-4 p-6">
      <h2 className="text-lg font-semibold">General</h2>

      <input
        className="input w-full form-control"
        placeholder="Platform name"
        value={form.platform_name}
        onChange={(e) => setForm({ ...form, platform_name: e.target.value })}
      />

      <input
        className="input w-full form-control"
        placeholder="Support email"
        value={form.support_email}
        onChange={(e) => setForm({ ...form, support_email: e.target.value })}
      />

      <select
        className="input w-full form-control"
        value={form.default_currency}
        onChange={(e) =>
          setForm({
            ...form,
            default_currency: e.target.value as "USD" | "EUR",
          })
        }
      >
        <option value="USD">USD</option>
        <option value="EUR">EUR</option>
      </select>

      <button className="btn btn-primary" disabled={isPending}>
        Save
      </button>
    </form>
  );
}
