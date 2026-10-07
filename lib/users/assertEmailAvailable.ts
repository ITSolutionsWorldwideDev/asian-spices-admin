/**
 * Reject an email if it already belongs to a privileged account:
 * platform admin, or store role admin / store_owner / manager / editor.
 */
export async function assertEmailNotPrivileged(
  client: { query: (sql: string, params?: any[]) => Promise<any> },
  email: string,
  fieldLabel = "email",
) {
  const normalized = String(email || "").trim();
  if (!normalized) return;

  const result = await client.query(
    `SELECT u.id
     FROM users u
     WHERE lower(u.email) = lower($1)
       AND (
         u.is_platform_admin = true
         OR lower(COALESCE(u.role, '')) IN (
           'super_admin', 'admin', 'store_owner', 'manager', 'editor'
         )
         OR EXISTS (
           SELECT 1
           FROM store_users su
           JOIN roles r ON r.id = su.role_id
           WHERE su.user_id = u.id
             AND r.key IN ('admin', 'store_owner', 'manager', 'editor')
         )
       )
     LIMIT 1`,
    [normalized],
  );

  if (result.rows.length > 0) {
    throw new Error(
      `This ${fieldLabel} is already used by an admin or staff account. Please use a different email.`,
    );
  }
}
