// apps/admin/app/api/store-users/route.ts
import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/core/db";
import { getCurrentStoreAPI } from "@/lib/auth/guards";
import { userSchema } from "@/lib/validations/user";
import bcrypt from "bcryptjs";

export async function GET(req: NextRequest) {
  try {
    const store = await getCurrentStoreAPI(req);

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = 10;
    const offset = (page - 1) * limit;

    const query = `
      SELECT 
        u.id, u.name, u.email, u.is_platform_admin, u.status, u.created_at 
      FROM users u
      JOIN store_users su ON u.id = su.user_id
      WHERE su.store_id = $1 
        AND (u.name ILIKE $2 OR u.email ILIKE $2)
      ORDER BY u.created_at DESC 
      LIMIT $3 OFFSET $4
    `;
    
    const countQuery = `
      SELECT COUNT(*) 
      FROM users u
      JOIN store_users su ON u.id = su.user_id
      WHERE su.store_id = $1 
        AND (u.name ILIKE $2 OR u.email ILIKE $2)
    `;

    const searchTerm = `%${search}%`;

    const [users, total] = await Promise.all([
      pool.query(query, [store.id, searchTerm, limit, offset]),
      pool.query(countQuery, [store.id, searchTerm])
    ]);

    return NextResponse.json({
      items: users.rows,
      total: parseInt(total.rows[0].count)
    });
  } catch (error) {console.error("GET_USERS_ERROR:", error);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  const client = await pool.connect();
  
  try {
    const store = await getCurrentStoreAPI(req);
    const body = await req.json();
    
    // Validate with Zod
    const validated = userSchema.parse(body);
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(validated.password || 'Temporary123!', 10);

    await client.query("BEGIN");

    // 1. Insert into Users table
    const userResult = await client.query(
      `INSERT INTO users (name, email, password_hash, is_platform_admin, status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [validated.name, validated.email, hashedPassword, validated.is_platform_admin, validated.status]
    );

    const userId = userResult.rows[0].id;

    // 2. Link user to the current store with the selected role
    await client.query(
      `INSERT INTO store_users (store_id, user_id, role_id)
       VALUES ($1, $2, $3)`,
      [store.id, userId, validated.role_id]
    );

    await client.query("COMMIT");

    return NextResponse.json({ id: userId, success: true }, { status: 201 });

  } catch (error: any) {
    await client.query("ROLLBACK");
    
    // Handle unique constraint violation (e.g., email already exists)
    if (error.code === '23505') {
      return NextResponse.json(
        { error: "A user with this email already exists." },
        { status: 400 }
      );
    }

    console.error("CREATE_USER_ERROR:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}