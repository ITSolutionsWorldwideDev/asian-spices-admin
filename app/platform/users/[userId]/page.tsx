// app/(platform)/users/[userId]/page.tsx

import { pool } from "@/core/db";
import { requirePlatformAdmin } from "@/lib/auth/guards";
import UserForm from "@/components/platform/client/UserForm";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ userId: string }>;
};

export default async function EditUserPage({ params }: Props) {
  await requirePlatformAdmin();
  const { userId } = await params;

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (!uuidRegex.test(userId)) {
    // If it's favicon.png or any non-uuid string, stop here
    return notFound();
  }

  // Fetch user details
  const userRes = await pool.query(
    `SELECT id, email, name, is_platform_admin, status FROM users WHERE id = $1`,
    [userId],
  );

  const user = userRes.rows[0];
  if (!user) notFound();

  // Fetch their store assignments
  const storesRes = await pool.query(
    `SELECT store_id, role_id FROM store_users WHERE user_id = $1`,
    [userId],
  );

  // Merge the data for the Form
  const userData = {
    ...user,
    stores: storesRes.rows, // This matches the 'user.stores' expected by UserForm
  };

  return (
    <div className="page-wrapper">
      <div className="content">
        <UserForm user={userData} />
      </div>
    </div>
  );
}

/* import { pool } from "@/core/db";
import { requirePlatformAdmin } from "@/lib/auth/guards";
import UserForm from "@/components/platform/client/UserForm";

type Props = {
  params: Promise<{ userId: string }>;
};

export default async function EditUserPage({ params }: Props) {
  await requirePlatformAdmin();

  const { userId } = await params;

  const { rows } = await pool.query(
    `SELECT id, email, name, is_platform_admin, status
     FROM users
     WHERE id = $1`,
    [userId],
  );

  const user = rows[0];

  if (!user) {
    return <p>User not found</p>;
  }

  return (
    <div className="page-wrapper">
      <div className="content">
        <UserForm user={user} />
      </div>
    </div>
  );
} */
