import { pool } from "@/core/db";
import { requirePlatformAdmin } from "@/lib/auth/guards";

interface InvoiceRow {
  id: string | number;
  store_id: string | number;
  amount_cents: number;
  status: string;
  issued_at: string | Date;
}

export default async function InvoicesPage() {
  await requirePlatformAdmin();

  const { rows } = await pool.query<InvoiceRow>(
    `
    SELECT id, store_id, amount_cents, status, issued_at
    FROM invoices
    ORDER BY issued_at DESC
    LIMIT 50
    `,
  );

  return (
    <div className="page-wrapper">
      <div className="content space-y-6">
        <div className="bg-white p-6 rounded shadow space-y-4">
          <h1 className="text-2xl font-bold">Invoices</h1>

          <table className="w-full table-auto bg-white rounded shadow">
            <thead>
              <tr className="bg-gray-100">
                <th>ID</th>
                <th>Store</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((i) => (
                <tr key={i.id} className="border-b">
                  <td className="text-xs">{i.id}</td>
                  <td>{i.store_id}</td>
                  <td>${(i.amount_cents / 100).toFixed(2)}</td>
                  <td>{i.status}</td>
                  <td>{new Date(i.issued_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
