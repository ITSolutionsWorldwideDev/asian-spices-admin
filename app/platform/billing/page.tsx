// app/(platform)/billing/page.tsx

import { pool } from "@/core/db";
import { requirePlatformAdmin } from "@/lib/auth/guards";
import Link from "next/link";

export default async function BillingDashboardPage() {
  await requirePlatformAdmin();

  const [{ rows: plans }, { rows: invoices }] = await Promise.all([
    pool.query(`SELECT COUNT(*) FROM plans WHERE is_active = true`),
    pool.query(`SELECT COUNT(*) FROM invoices`),
  ]);

  return (
    <div className="page-wrapper">
      <div className="content space-y-6">
        <div className="bg-white p-6 rounded shadow space-y-4">
          <h1 className="text-2xl font-bold">Billing</h1>

          <div className="grid grid-cols-2 gap-4">
            <div className="card p-6">
              <p className="text-gray-500">Active Plans</p>
              <p className="text-3xl font-bold">{plans[0].count}</p>
            </div>

            <div className="card p-6">
              <p className="text-gray-500">Invoices</p>
              <p className="text-3xl font-bold">{invoices[0].count}</p>
            </div>
          </div>

          <div className="flex gap-4">
            <Link href="/platform/billing/plans" className="btn btn-primary">
              Manage Plans
            </Link>
            <Link href="/platform/billing/invoices" className="btn btn-secondary">
              View Invoices
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
