import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/core/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = (page - 1) * limit;

    // Merge all audit tables. LEFT JOIN users to get actor email/name.
    const result = await pool.query(
      `
      SELECT
        al.id::text,
        al.actor_id::text,
        COALESCE(u.email, (al.metadata::jsonb ->> 'email'), al.actor_id::text) AS actor_label,
        al.action,
        al.entity,
        al.entity_id::text,
        al.created_at,
        'general' AS source
      FROM audit_logs al
      LEFT JOIN users u ON u.id::text = al.actor_id::text

      UNION ALL

      SELECT
        ual.id::text,
        ual.actor_id::text,
        COALESCE(u.email, ual.actor_id::text) AS actor_label,
        ual.action,
        'user'            AS entity,
        ual.user_id::text AS entity_id,
        ual.created_at,
        'user'            AS source
      FROM user_audit_logs ual
      LEFT JOIN users u ON u.id::text = ual.actor_id::text

      UNION ALL

      SELECT
        bal.id::text,
        bal.actor_id::text,
        COALESCE(u.email, bal.actor_id::text) AS actor_label,
        bal.action,
        'billing'          AS entity,
        bal.store_id::text AS entity_id,
        bal.created_at,
        'billing'          AS source
      FROM billing_audit_logs bal
      LEFT JOIN users u ON u.id::text = bal.actor_id::text

      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
      `,
      [limit, offset],
    );

    const countResult = await pool.query(`
      SELECT (
        (SELECT COUNT(*) FROM audit_logs) +
        (SELECT COUNT(*) FROM user_audit_logs) +
        (SELECT COUNT(*) FROM billing_audit_logs)
      ) AS total
    `);

    return NextResponse.json({
      logs: result.rows,
      total: parseInt(countResult.rows[0]?.total || "0"),
    });
  } catch (err: any) {
    console.error("activity log error:", err);
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 },
    );
  }
}
