// apps\admin\app\api\customers\[customerId]\addresses\[addressId]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/core/db";

type Params = Promise<{ customerId: string; addressId: string }>;

export async function PUT(
  req: NextRequest, 
  { params }: { params: Params }
) {
  const { customerId, addressId } = await params;
  const body = await req.json();

  await pool.query(
    `
    UPDATE store_customer_addresses
    SET label=$1,address_line1=$2,address_line2=$3,city=$4,state=$5,postal_code=$6,country=$7,is_default=$8,updated_at=NOW()
    WHERE id=$9 AND customer_id=$10
    `,
    [
      body.label,
      body.address_line1,
      body.address_line2,
      body.city,
      body.state,
      body.postal_code,
      body.country,
      body.is_default || false,
      addressId,
      customerId
    ]
  );

  return NextResponse.json({ success: true });
}


export async function DELETE(
  _: NextRequest, 
  { params }: { params: Params }
) {
  
  const { customerId, addressId } = await params;

  await pool.query(
    `DELETE FROM store_customer_addresses WHERE id=$1 AND customer_id=$2`,
    [addressId, customerId]
  );

  return NextResponse.json({ success: true });
}