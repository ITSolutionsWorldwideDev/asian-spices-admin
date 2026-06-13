// apps/admin/app/api/register-customer/route.ts

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/core/db";

export async function POST(req: Request) {
  const body = await req.json();

  const {
    firstName,
    lastName,
    email,
    phone,
    address,
    city,
    country,
    zip,
    cartItems,
  } = body;

  try {
    const checkUserQuery = `SELECT user_id FROM users WHERE email = $1 LIMIT 1`;
    const existingUser = await pool.query(checkUserQuery, [email]);

    let userId: number = 0;

    if (existingUser.rows.length > 0) {
      userId = existingUser.rows[0].id;
    } else {
      const insertUserQuery = `
            INSERT INTO users (
              username, password_hash,
              "firstName", "lastName", email, "addrPhone", addr1, city, country, zip,
              created_at, updated_at
            )
            VALUES (
              $1, $2,
              $3, $4, $5, $6, $7, $8, $9, $10,
              NOW(), NOW()
            )
            RETURNING user_id;
          `;

      const result = await pool.query(insertUserQuery, [
        email.split("@")[0], // username (basic fallback)
        "temporary", // password_hash (temporary for guest)
        firstName,
        lastName,
        email,
        phone,
        address,
        city,
        country,
        zip,
      ]);

      userId = result.rows[0].user_id;
    }

    // 3️⃣ Update cart items — optional step if needed here
    if (Array.isArray(cartItems) && cartItems.length > 0) {
      for (const item of cartItems) {
        const { itemid, quantity, price } = item; // Adjust based on your frontend cart schema

        // Insert or update logic
        const checkCartItemQuery = `SELECT * FROM store_cart_items WHERE user_id = $1 AND item_id = $2`;

        const cartItemResult = await pool.query(checkCartItemQuery, [
          userId,
          itemid,
        ]);

        if (cartItemResult.rows.length > 0) {
          const updateCartItemQuery = `
            UPDATE store_cart_items 
            SET quantity = quantity + $1, added_at = NOW()
            WHERE user_id = $2 AND item_id = $3;
          `;
          await pool.query(updateCartItemQuery, [quantity, userId, itemid]);
        } else {
          const insertCartItemQuery = `
            INSERT INTO store_cart_items (user_id, item_id, quantity, price, added_at)
            VALUES ($1, $2, $3, $4, NOW());
          `;
          await pool.query(insertCartItemQuery, [
            userId,
            itemid,
            quantity,
            price ?? 0,
          ]);
        }
      }
    }

    return NextResponse.json(
      { success: true, userId },
      { status: existingUser.rows.length > 0 ? 200 : 201 }
    );
  } catch (error: any) {
    console.error("Error in register-customer:", error?.message || error);
    return NextResponse.json(
      { error: "Failed to process customer", details: error?.message },
      { status: 500 }
    );
  }
}
