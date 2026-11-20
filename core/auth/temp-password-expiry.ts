import bcrypt from "bcryptjs";
import { pool } from "@/core/db";
import {
  sendPartnerApprovalEmail,
  sendTempPasswordLockedSupportEmail,
} from "@/core/email-templates";

/** How long a temp password can sit unchanged before auto-rotate + email. */
export const TEMP_PASSWORD_EXPIRY_MINUTES = 30;

type ExpiredTempPasswordUser = {
  id: string;
  email: string;
  name: string | null;
  role: string | null;
  store_id: string | null;
  temp_password_reminders: number;
  store_name: string | null;
  application_id: string | null;
  partner_first_name: string | null;
  business_email: string | null;
};

function generateTempPassword() {
  return Math.random().toString(36).slice(-10);
}

/**
 * Find partner/store-admin accounts still on a temporary password whose
 * password_changed_at is older than TEMP_PASSWORD_EXPIRY_MINUTES.
 * Requires password_changed_at so users created before this feature
 * (null timestamp) are never auto-touched.
 */
async function findExpiredTempPasswordUsers(): Promise<ExpiredTempPasswordUser[]> {
  const { rows } = await pool.query<ExpiredTempPasswordUser>(
    `
    SELECT
      u.id,
      u.email,
      u.name,
      u.role,
      u.store_id,
      COALESCE(u.temp_password_reminders, 0)::int AS temp_password_reminders,
      s.name AS store_name,
      pr.application_id,
      pr.first_name AS partner_first_name,
      pr.business_email_address AS business_email
    FROM users u
    LEFT JOIN stores s ON s.id::text = u.store_id::text
    LEFT JOIN LATERAL (
      SELECT
        pr.application_id,
        pr.first_name,
        pr.business_email_address
      FROM partner_registration pr
      WHERE s.partner_registration_id::text = pr.partner_id::text
         OR (
           pr.application_id IS NOT NULL
           AND s.partner_registration_id::text = pr.application_id::text
         )
      LIMIT 1
    ) pr ON TRUE
    WHERE u.status = 'active'
      AND COALESCE(u.is_platform_admin, false) = false
      AND u.must_change_password IS DISTINCT FROM true
      AND u.password_changed_at IS NOT NULL
      AND u.password_changed_at < NOW() - ($1 * INTERVAL '1 minute')
      AND COALESCE(u.temp_password_reminders, 0) < 2
      AND (
        u.role IN ('store_owner', 'admin')
        OR EXISTS (
          SELECT 1
          FROM store_users su
          JOIN roles r ON r.id = su.role_id
          WHERE su.user_id = u.id
            AND r.key IN ('store_owner', 'admin')
        )
      )
    ORDER BY u.password_changed_at ASC
    LIMIT 100
    `,
    [TEMP_PASSWORD_EXPIRY_MINUTES],
  );

  return rows;
}

async function rotateTempPassword(
  userId: string,
  expectedReminders: number,
  nextReminders: number,
  plainPassword: string,
): Promise<boolean> {
  const passwordHash = await bcrypt.hash(plainPassword, 10);
  const result = await pool.query(
    `
    UPDATE users
    SET password_hash = $1,
        must_change_password = false,
        password_changed_at = NOW(),
        temp_password_reminders = $2
    WHERE id = $3
      AND must_change_password IS DISTINCT FROM true
      AND COALESCE(temp_password_reminders, 0) = $4
      AND password_changed_at IS NOT NULL
      AND password_changed_at < NOW() - ($5 * INTERVAL '1 minute')
    `,
    [
      passwordHash,
      nextReminders,
      userId,
      expectedReminders,
      TEMP_PASSWORD_EXPIRY_MINUTES,
    ],
  );

  return (result.rowCount ?? 0) > 0;
}

export async function processExpiredTempPasswords() {
  const users = await findExpiredTempPasswordUsers();
  const summary = {
    scanned: users.length,
    resentCredentials: 0,
    lockedWithSupportEmail: 0,
    skipped: 0,
    errors: 0,
  };

  for (const user of users) {
    const reminders = Number(user.temp_password_reminders) || 0;
    const tempPassword = generateTempPassword();
    const nextReminders = reminders + 1;

    try {
      const updated = await rotateTempPassword(
        user.id,
        reminders,
        nextReminders,
        tempPassword,
      );

      if (!updated) {
        summary.skipped += 1;
        continue;
      }

      const firstName =
        user.partner_first_name ||
        (user.name ? String(user.name).split(/\s+/)[0] : "") ||
        "Partner";
      const notifyEmail = user.business_email || user.email;

      if (reminders === 0) {
        const mail = await sendPartnerApprovalEmail({
          email: notifyEmail,
          companyName: user.store_name || "Your company",
          firstName,
          applicationId: user.application_id || undefined,
          tempPassword,
          loginEmail: user.email,
        });
        if (!mail.success) {
          console.error(
            "[temp-password-expiry] credentials resend failed",
            user.id,
            mail.error,
          );
        }
        summary.resentCredentials += 1;
      } else {
        const mail = await sendTempPasswordLockedSupportEmail({
          email: notifyEmail,
          firstName,
          loginEmail: user.email,
          companyName: user.store_name || undefined,
        });
        if (!mail.success) {
          console.error(
            "[temp-password-expiry] support lock email failed",
            user.id,
            mail.error,
          );
        }
        summary.lockedWithSupportEmail += 1;
      }
    } catch (error) {
      summary.errors += 1;
      console.error("[temp-password-expiry] failed for user", user.id, error);
    }
  }

  return summary;
}
