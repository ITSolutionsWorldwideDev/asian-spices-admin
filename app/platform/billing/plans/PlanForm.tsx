"use client";

import { useState, useTransition } from "react";
import { useToast } from "@/core/ui";
import { createPlan } from "../actions";

export default function PlanForm() {
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [form, setForm] = useState({
    name: "",
    price_cents: 0,
    interval: "monthly" as "monthly" | "yearly",
    features: {
      users: true,
      stores: true,
    },
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();

    startTransition(async () => {
      await createPlan(form);
      showToast("success", "Plan created");
      setForm({ ...form, name: "", price_cents: 0 });
    });
  }

  return (
    <form onSubmit={submit} className="card space-y-4 max-w-md p-6">
      <h2 className="font-semibold">Create Plan</h2>

      <label className="form-label">Plan name<span className="text-danger ms-1">*</span></label>

      <input
        className="input w-full form-control"
        placeholder="Plan name"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        required
      />

      <label className="form-label">Price<span className="text-danger ms-1">*</span></label>

      <input
        type="number"
        className="input w-full form-control"
        placeholder="Price (cents)"
        value={form.price_cents}
        onChange={(e) =>
          setForm({ ...form, price_cents: Number(e.target.value) })
        }
      />

      <label className="form-label">Variation<span className="text-danger ms-1">*</span></label>

      <select
        className="input w-full form-control"
        value={form.interval}
        onChange={(e) =>
          setForm({ ...form, interval: e.target.value as any })
        }
      >
        <option value="monthly">Monthly</option>
        <option value="yearly">Yearly</option>
      </select>

      <button disabled={isPending} className="btn btn-primary">
        Create
      </button>
    </form>
  );
}
