// apps/admin/app/(store)/users/[userId]/page.tsx

import { pool } from "@/core/db";
import { headers } from "next/headers"; // Import headers
import { NextRequest } from "next/server"; // Import type
import { getCurrentStoreAPI } from "@/lib/auth/guards";
import { requirePlatformAdmin } from "@/lib/auth/guards";
import { notFound } from "next/navigation";
import ManageUserForm from "@/components/store/users/ManageUserForm";

type Props = {
  params: Promise<{ userId: string }>;
};
export default async function EditUserPage({ params }: Props) {
  const { userId } = await params;

  const headerList = await headers();
  const req = new NextRequest(new URL("http://localhost"), {
    headers: headerList,
  });

  const store = await getCurrentStoreAPI(req);

  const userRes = await pool.query(
    `SELECT u.id, u.email, u.name, u.is_platform_admin, u.status, su.role_id 
     FROM users u
     INNER JOIN store_users su ON u.id = su.user_id
     WHERE u.id = $1 AND su.store_id = $2`,
    [userId, store.id],
  );

  const user = userRes.rows[0];

  if (!user) notFound();

  const rolesRes = await pool.query(
    `SELECT id, key as name FROM roles WHERE scope = 'store' ORDER BY name ASC`,
  );

  return (
    <div className="page-wrapper2">
      <div className="content">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Edit User</h1>
          <p className="text-sm text-gray-500">
            Update permissions and account details for {user.name}.
          </p>
        </div>
        <ManageUserForm
          initialData={user}
          userId={userId}
          roles={rolesRes.rows}
        />
      </div>
    </div>
  );
}
