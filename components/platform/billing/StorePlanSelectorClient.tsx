// apps/admin/components/platform/billing/StorePlanSelectorClient.tsx
"use client";

import { useTransition } from "react";
// import { assignPlanToStore } from "@/app/(platform)/platform/billing/actions";
import { assignPlanToStore } from "@/app/platform/billing/actions";
import { useToast } from "@/core/ui";

export default function StorePlanSelectorClient({
  storeId,
  plans,
  currentPlanId,
  currentPlanName,
}: any) {
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();

  function handleChange(planId: string) {
    startTransition(async () => {
      await assignPlanToStore(storeId, planId);
      showToast("success", "Plan updated");
    });
  }

  return (
    <div className="card space-y-4">
      <div className="bg-white p-6 rounded shadow max-w-xl space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-5">
          <h4 className="text-xl font-bold text-gray-900">Subscription</h4>
        </div>
        <div className=" mx-auto">
          <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm space-y-6">
            <p>
              Current Plan: <strong>{currentPlanName ?? "None"}</strong>
            </p>

            <select
              defaultValue={currentPlanId ?? ""}
              onChange={(e) => handleChange(e.target.value)}
              disabled={isPending}
              className="input"
            >
              <option value="">No Plan</option>
              {plans.map((p: any) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

/* "use client";

import { useTransition } from "react";
import { useToast } from "@/core/ui";
import { assignPlanToStore } from "@/app/(platform)/billing/actions";

type Props = {
  stores: {
    id: string;
    name: string;
    plan_id: string | null;
  }[];
  plans: {
    id: string;
    name: string;
  }[];
};

export default function StorePlanSelectorClient({
  stores,
  plans,
}: Props) {
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();

  function handleChange(storeId: string, planId: string) {
    startTransition(async () => {
      await assignPlanToStore(storeId, planId);
      showToast("success", "Plan updated");
    });
  }

  return (
    <div className="card space-y-4">
      <h2 className="text-lg font-semibold">
        Store Plan Assignment
      </h2>

      <table className="w-full table-auto">
        <thead>
          <tr className="bg-gray-100">
            <th>Store</th>
            <th>Plan</th>
          </tr>
        </thead>
        <tbody>
          {stores.map((store) => (
            <tr key={store.id} className="border-b">
              <td>{store.name}</td>
              <td>
                <select
                  defaultValue={store.plan_id ?? ""}
                  onChange={(e) =>
                    handleChange(store.id, e.target.value)
                  }
                  disabled={isPending}
                  className="input"
                >
                  <option value="">No Plan</option>
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
 */
