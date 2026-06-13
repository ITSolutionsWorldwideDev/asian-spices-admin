//  apps/admin/app/(store)/settings/roles/new/page.tsx
import ManageRoleForm from "@/components/platform/settings/ManageRoleForm";
import { pool } from "@/core/db";

export default async function NewRolePage() {
  // Fetch all permissions to show in the checkbox grid
  const permissionsRes = await pool.query(
    "SELECT id, key FROM permissions ORDER BY key ASC",
  );

  return (
    <div className="page-wrapper2">
      <div className="content">
        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Create New Role</h1>
            <p className="text-gray-500 text-sm">
              Define a new role and its associated permissions.
            </p>
          </div>

          <ManageRoleForm permissions={permissionsRes.rows} />
        </div>
      </div>
    </div>
  );
}
