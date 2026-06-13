// apps/admin/components/platform/stores/AdminAnalytics.tsx
"use client";

import { useEffect, useState } from "react";

export default function AdminAnalytics() {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/platform/orders/analytics")
      .then((res) => res.json())
      .then((d) => setData(d.analytics));
  }, []);

  return (
    <div className="bg-white p-4 rounded shadow">
      <h2 className="font-semibold mb-4">Store Performance</h2>

      <table className="w-full text-sm">
        <thead className="text-left bg-gray-100">
          <tr>
            <th className="p-2">Store</th>
            <th>Total Fulfilled</th>
            <th>Full</th>
            <th>Partial</th>
            <th>Rejected</th>
          </tr>
        </thead>

        <tbody>
          {data.map((s, i) => (
            <tr key={i} className="border-t">
              <td className="p-2">{s.store_name}</td>
              <td>{s.total_fulfilled}</td>
              <td className="text-green-600">{s.full_count}</td>
              <td className="text-yellow-600">{s.partial_count}</td>
              <td className="text-red-600">{s.rejected_count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}