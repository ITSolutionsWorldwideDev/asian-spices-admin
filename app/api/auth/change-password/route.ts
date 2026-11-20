import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { adminAuthOptions } from "@/core/auth";
import { runQuery } from "@/core/db";
import { AUTH_ROLES } from "@/core/auth/core/constants";

const FORCE_CHANGE_ROLES = new Set<string>([
  AUTH_ROLES.STORE_OWNER,
  AUTH_ROLES.ADMIN,
]);

export async function POST(req: Request) {
  try {
    const session = await getServerSession(adminAuthOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.isPlatformAdmin) {
      return NextResponse.json(
        { error: "Platform admins cannot use this endpoint" },
        { status: 403 },
      );
    }

    const isPartnerOrStoreAdmin = (session.user.storeRoles || []).some((r) =>
      FORCE_CHANGE_ROLES.has(r.role),
    );
    if (!isPartnerOrStoreAdmin) {
      return NextResponse.json({ error: "Not allowed" }, { status: 403 });
    }

    const body = await req.json();
    const password = String(body.password || "");
    const confirmPassword = String(body.confirmPassword || "");

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 },
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: "Passwords do not match" },
        { status: 400 },
      );
    }

    const userRes = await runQuery<{
      id: string;
      must_change_password: boolean | null;
    }>(
      `SELECT id, must_change_password
       FROM users
       WHERE id = $1 AND status = 'active'`,
      [session.user.id],
    );

    const user = userRes.rows[0];
    if (!user) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    // false (or null) means they still need to change a temporary password.
    if (user.must_change_password === true) {
      return NextResponse.json(
        { error: "Password change is not required" },
        { status: 400 },
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    // must_change_password = true means the forced temp-password change is done.
    // Reset reminder counter so any future temp-password issue starts clean.
    await runQuery(
      `UPDATE users
       SET password_hash = $1,
           must_change_password = true,
           password_changed_at = NOW(),
           temp_password_reminders = 0
       WHERE id = $2`,
      [passwordHash, session.user.id],
    );

    return NextResponse.json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error("[change-password]", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
