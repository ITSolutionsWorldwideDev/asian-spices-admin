import { pool } from "@/core/db";
import { requirePlatformAdmin } from "@/lib/auth/guards";
import PlanForm from "./PlanForm";

export default async function PlansPage() {
  await requirePlatformAdmin();

  const { rows: plans } = await pool.query(
    `SELECT * FROM plans ORDER BY created_at DESC`,
  );

  return (
    <div className="page-wrapper">
      <div className="content space-y-6">
        <div className="bg-white p-6 rounded shadow space-y-4">
          <h1 className="text-2xl font-bold">Plans</h1>

          <PlanForm />

          <table className="w-full table-auto bg-white rounded shadow">
            <thead>
              <tr className="bg-gray-100">
                <th>Name</th>
                <th>Price</th>
                <th>Interval</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {plans.map((p) => (
                <tr key={p.id} className="border-b">
                  <td>{p.name}</td>
                  <td>€{(p.price_cents / 100).toFixed(2)}</td>
                  <td>{p.interval}</td>
                  <td>{p.is_active ? "Active" : "Inactive"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
