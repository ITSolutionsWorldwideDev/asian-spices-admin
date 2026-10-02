import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { runQuery } from "@/core/db";
import { sendEmail } from "@/core/email";

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

/** Approved partner business email OR Initial Admin on that partner's store */
const PARTNER_ACCOUNT_SQL = `
  (
    EXISTS (
      SELECT 1
      FROM partner_registration pr
      WHERE LOWER(pr.business_email_address) = LOWER(u.email)
        AND pr.status = 'approved'
    )
    OR EXISTS (
      SELECT 1
      FROM store_users su
      JOIN stores s ON s.id = su.store_id
      JOIN roles r ON r.id = su.role_id
      JOIN partner_registration pr
        ON pr.partner_id::text = s.partner_registration_id
        OR pr.application_id = s.partner_registration_id
      WHERE su.user_id = u.id
        AND r.key IN ('admin', 'store_owner')
        AND pr.status = 'approved'
    )
  )
`;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const action = body.action as "send-otp" | "reset";
    const email = String(body.email || "")
      .trim()
      .toLowerCase();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    if (action === "send-otp") {
      const userRes = await runQuery(
        `SELECT u.id
         FROM users u
         WHERE LOWER(u.email) = $1
           AND u.status = 'active'
           AND ${PARTNER_ACCOUNT_SQL}`,
        [email],
      );

      if ((userRes.rowCount ?? 0) === 0) {
        return NextResponse.json(
          { error: "Account does not exist" },
          { status: 404 },
        );
      }

      const otp = generateOtp();
      const otpHash = await bcrypt.hash(otp, 10);
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      await runQuery(
        `INSERT INTO admin_password_reset_otps (email, otp_hash, expires_at)
         VALUES ($1, $2, $3)
         ON CONFLICT (email)
         DO UPDATE SET otp_hash = EXCLUDED.otp_hash, expires_at = EXCLUDED.expires_at, created_at = NOW()`,
        [email, otpHash, expiresAt.toISOString()],
      );

      await sendEmail({
        to: email,
        subject: "Your Asian Spices password reset code",
        fromAccount: "default",
        html: `
            <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #ea580c;">Password Reset</h2>
              <p>Use this one-time code to reset your password. It expires in 10 minutes.</p>
              <p style="font-size: 28px; letter-spacing: 6px; font-weight: bold; text-align: center; margin: 24px 0;">
                ${otp}
              </p>
              <p style="font-size: 12px; color: #6b7280;">If you did not request this, you can ignore this email.</p>
            </div>
          `,
      });

      return NextResponse.json({
        success: true,
        message: "OTP has been sent to your email.",
      });
    }

    if (action === "reset") {
      const otp = String(body.otp || "").trim();
      const password = String(body.password || "");

      if (!otp || password.length < 6) {
        return NextResponse.json(
          { error: "Valid OTP and a password of at least 6 characters are required" },
          { status: 400 },
        );
      }

      const otpRes = await runQuery<{ otp_hash: string; expires_at: string }>(
        `SELECT otp_hash, expires_at FROM admin_password_reset_otps WHERE email = $1`,
        [email],
      );

      const row = otpRes.rows[0];
      if (!row) {
        return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 400 });
      }

      if (new Date(row.expires_at).getTime() < Date.now()) {
        await runQuery(`DELETE FROM admin_password_reset_otps WHERE email = $1`, [email]);
        return NextResponse.json({ error: "OTP has expired" }, { status: 400 });
      }

      const valid = await bcrypt.compare(otp, row.otp_hash);
      if (!valid) {
        return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 400 });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const updateRes = await runQuery(
        `UPDATE users u
         SET password_hash = $1
         WHERE LOWER(u.email) = $2
           AND u.status = 'active'
           AND ${PARTNER_ACCOUNT_SQL}`,
        [passwordHash, email],
      );

      if ((updateRes.rowCount ?? 0) === 0) {
        return NextResponse.json({ error: "Account not found" }, { status: 404 });
      }

      await runQuery(`DELETE FROM admin_password_reset_otps WHERE email = $1`, [email]);

      return NextResponse.json({
        success: true,
        message: "Password updated. You can sign in now.",
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("[forgot-password]", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
