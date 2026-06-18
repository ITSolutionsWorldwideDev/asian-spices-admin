// File: app/(store)/settings/roles/page.tsx
import { pool } from "@/core/db";
import Link from "next/link";

interface RoleWithPermCountRow {
  id: string | number;
  key: string;
  scope: "store" | "platform" | string;
  perm_count: string | number;
}

export default async function RolesPage() {
  const roles = await pool.query<RoleWithPermCountRow>(`
    SELECT r.*, COUNT(rp.permission_id) as perm_count 
    FROM roles r 
    LEFT JOIN role_permissions rp ON r.id = rp.role_id
    WHERE r.scope = 'store' 
    GROUP BY r.id 
    ORDER BY r.scope, r.key
  `);

  return (
    <div className="page-wrapper2">
      <div className="content">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Roles & Permissions</h1>
            <Link
              href="/settings/roles/new"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg"
            >
              Create New Role
            </Link>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="p-4 font-semibold">Role Key</th>
                  <th className="p-4 font-semibold">Scope</th>
                  <th className="p-4 font-semibold">Permissions Count</th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {roles.rows.map((role) => (
                  <tr key={role.id} className="border-b hover:bg-gray-50">
                    <td className="p-4 font-mono text-sm">{role.key}</td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-1 rounded text-xs ${role.scope === "platform" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}
                      >
                        {role.scope}
                      </span>
                    </td>
                    <td className="p-4">{role.perm_count} active</td>
                    <td className="p-4 text-right">
                      <Link
                        href={`/settings/roles/${role.id}`}
                        className="text-blue-600 hover:underline"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
