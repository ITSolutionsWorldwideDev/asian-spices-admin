// apps/admin/app/platform/stores/[storeId]/page.tsx

import { pool } from "@/core/db";
import { requirePlatformAdmin } from "@/lib/auth/guards";
import StoreForm from "./StoreForm";
import StorePlanSection from "../StorePlanSection";

import { notFound } from "next/navigation";

function isUUID(id: string) {
  return /^[0-9a-fA-F-]{36}$/.test(id);
}

export default async function EditStorePage({
  params,
  searchParams,
}: {
  params: Promise<{ storeId: string }>;
  searchParams?: Promise<{ tab?: string }>;
}) {
  await requirePlatformAdmin();

  const { storeId } = await params;

  if (!storeId || !isUUID(storeId)) {
    return notFound();
  }
  const { tab } = searchParams ? await searchParams : {};

  if (!storeId) {
    throw new Error("Store ID is required");
  }

  const [{ rows: storeRows }, { rows: subscriptionRows }] = await Promise.all([
    pool.query(
      `
      SELECT 
        s.*, 
        pr.*
      FROM stores s
      LEFT JOIN partner_registration pr 
        ON pr.partner_id::text = s.partner_registration_id
      WHERE s.id = $1
      `,
      [storeId],
    ),
    pool.query(
      `
        SELECT sub.plan_id, p.name AS plan_name
        FROM subscriptions sub
        LEFT JOIN plans p ON p.id = sub.plan_id
        WHERE sub.store_id = $1
        `,
      [storeId],
    ),
  ]);

  const store = storeRows[0];

  const subscription = subscriptionRows[0] ?? null;

  if (!store) {
    return <p>Store not found</p>;
  }

  return (
    <div className="space-y-8">
      {/* General Tab */}
      {!tab && <StoreForm store={store} />}

      {/* Plan Tab */}
      {tab === "plan" && (
        <StorePlanSection
          storeId={store.id}
          currentPlanId={subscription?.plan_id ?? null}
          currentPlanName={subscription?.plan_name ?? null}
        />
      )}
    </div>
  );
}
