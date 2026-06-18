// app/(store)/users/new/page.tsx

import { pool } from "@/core/db";
import ManageUserForm from "@/components/store/users/ManageUserForm";

export default async function NewUserPage() {
  // Fetch roles from the database to pass to the form
  // You might want to filter roles by those available to this specific store
  const rolesRes = await pool.query(
    `SELECT id, key as name FROM roles WHERE scope = 'store' ORDER BY name ASC`
  );

  return (
    <div className="page-wrapper2">
      <div className="content">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Add New User</h1>
          <p className="text-gray-500">Create a new user and assign them a store role.</p>
        </div>
        
        <ManageUserForm roles={rolesRes.rows} />
      </div>
    </div>
  );
}