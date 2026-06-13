// apps/admin/components/platform/settings/FeatureFlagsForm.tsx

"use client";

import { useState, useTransition } from "react";
import { updatePlatformSetting } from "./actions";
import { useToast } from "@/core/ui";

type Props = {
  initialValues: {
    enable_store_suspension?: boolean;
    enable_audit_logs?: boolean;
  };
};

export default function FeatureFlagsForm({ initialValues }: Props) {
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [form, setForm] = useState({
    enable_store_suspension: initialValues.enable_store_suspension ?? true,
    enable_audit_logs: initialValues.enable_audit_logs ?? true,
  });

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    startTransition(async () => {
      await updatePlatformSetting("features", form);
      showToast("success", "Feature flags updated");
    });
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-4 p-6">
      <h2 className="text-lg font-semibold">Feature Flags</h2>

      <label className="flex gap-2 items-center">
        <input
          type="checkbox"
          checked={form.enable_store_suspension}
          onChange={(e) =>
            setForm({
              ...form,
              enable_store_suspension: e.target.checked,
            })
          }
        />
        Enable store suspension
      </label>

      <label className="flex gap-2 items-center">
        <input
          type="checkbox"
          checked={form.enable_audit_logs}
          onChange={(e) =>
            setForm({
              ...form,
              enable_audit_logs: e.target.checked,
            })
          }
        />
        Enable audit logs
      </label>

      <button className="btn btn-primary" disabled={isPending}>
        Save
      </button>
    </form>
  );
}
