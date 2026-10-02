/**
 * Keep legacy users.role in sync for display/DB inspection.
 * Auth still uses store_users + roles / is_platform_admin.
 */
export async function syncUserRoleColumn(
  client: { query: (sql: string, params?: any[]) => Promise<any> },
  userId: string,
) {
  await client.query(
    `UPDATE users u
     SET role = CASE
       WHEN u.is_platform_admin THEN 'super_admin'
       ELSE (
         SELECT r.key
         FROM store_users su
         JOIN roles r ON r.id = su.role_id
         WHERE su.user_id = u.id
         ORDER BY CASE WHEN r.key = 'store_owner' THEN 0 ELSE 1 END, r.key
         LIMIT 1
       )
     END
     WHERE u.id = $1`,
    [userId],
  );
}
