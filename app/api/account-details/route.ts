// /app/api/account-details/route.ts (GET)

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/core/db";

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  const result = await pool.query(
    `SELECT u.*, b.billingFirstName, b.billingLastName, b.billingAddress, b.billingPhone,b.billingCity,b.billingZip,b.billingEmail,b.country as billingCountry
   FROM users u 
   LEFT JOIN billing_addresses b ON u.user_id = b.user_id 
   WHERE u.user_id = $1 LIMIT 1`,
    [userId]
  );

  const data: any = {};
  data.account = result.rows;
  return NextResponse.json(data);
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const {
    userId,
    firstName,
    lastName,
    addrPhone,
    addr1,
    city,
    zip,
    country,
    billingFirstName,
    billingLastName,
    billingPhone,
    billingEmail,
    billingAddress,
    billingCity,
    billingZip,
    billingCountry,
    wantsToBeWholesaler,
    companyName,
    taxId,
  } = body;

  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  await pool.query(
    `UPDATE users SET 
      "firstName" = $1,
      "lastName" = $2,
      "addrPhone" = $3,
      addr1 = $4,
      city = $5,
      zip = $6,
      country = $7,
      updated_at = NOW()
     WHERE user_id = $8`,
    [firstName, lastName, addrPhone, addr1, city, zip, country, userId]
  );

  // 2. Upsert billing address

  await pool.query(
    `INSERT INTO billing_addresses (
        user_id, "billingfirstname", "billinglastname", billingaddress, billingcity, billingzip, country, billingphone, billingemail, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
      ON CONFLICT (user_id)
      DO UPDATE SET
        billingfirstname = EXCLUDED.billingfirstname,
        billinglastname = EXCLUDED.billinglastname,
        billingaddress = EXCLUDED.billingaddress,
        billingcity = EXCLUDED.billingcity,
        billingzip = EXCLUDED.billingzip,
        country = EXCLUDED.country,
        billingphone = EXCLUDED.billingphone,
        billingemail = EXCLUDED.billingemail,
        updated_at = NOW();`,
    [
      userId,
      billingFirstName,
      billingLastName,
      billingAddress,
      billingCity,
      billingZip,
      billingCountry,
      billingPhone,
      billingEmail,
    ]
  );

  // 3️⃣ Handle wholesaler request
  if (wantsToBeWholesaler) {
    await pool.query(
      `UPDATE users
       SET wholesaler_request_status = 'pending',
           wholesaler_requested_at = NOW(),
           companyName = $1,
           taxId = $2
       WHERE user_id = $3`,
      [companyName, taxId, userId]
    );
  }


  return NextResponse.json({ success: true });
}
