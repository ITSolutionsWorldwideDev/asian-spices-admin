// apps/admin/app/(store)/settings/roles/[roleId]/page.tsx

import ManageRoleForm from "@/components/platform/settings/ManageRoleForm";
import { pool } from "@/core/db";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ roleId: string }>;
};

interface RoleRow {
  id: string | number;
  key: string;
  scope: string;
}

interface AssignedPermissionRow {
  permission_id: string;
}


export default async function EditRolePage({ params }: Props) {
  const { roleId } = await params;

  // 1. Fetch the Role details
  const roleRes = await pool.query<RoleRow>(
    "SELECT id, key, scope FROM roles WHERE id = $1 AND scope = 'store'",
    [roleId],
  );
  const role = roleRes.rows[0];

  if (!role) notFound();

  // 2. Fetch all available permissions (for the list)
  const allPermissionsRes = await pool.query(
    "SELECT id, key FROM permissions ORDER BY key ASC",
  );

  // 3. Fetch ONLY the permission IDs currently assigned to this role
  const assignedPermsRes = await pool.query<AssignedPermissionRow>(
    "SELECT permission_id FROM role_permissions WHERE role_id = $1",
    [roleId],
  );

  // Prepare data for the form
  const initialData = {
    ...role,
    // Flatten the array of objects into an array of UUID strings
    permissions: assignedPermsRes.rows.map((row) => row.permission_id),
  };

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Edit Role: {role.key}</h1>
            <p className="text-gray-500 text-sm">
              Modify permissions for this {role.scope} level role.
            </p>
          </div>

          <ManageRoleForm
            roleId={roleId}
            initialData={initialData}
            permissions={allPermissionsRes.rows}
          />
        </div>
      </div>
    </div>
  );
}
