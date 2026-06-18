// app/api/shipping/generate-label/route.ts

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/core/db";
import { getCurrentStoreAPI } from "@/lib/auth/guards";
import { getShippingProvider } from "@/lib/shipping/providerFactory";

export async function POST(req: NextRequest) {
  try {

    const store = await getCurrentStoreAPI(req);
    const storeId = store.id;

    const { orderId } = await req.json();

    const shipmentRes = await pool.query(
      `SELECT * FROM shipments WHERE order_id = $1 AND store_id = $2`,
      [orderId, storeId],
    );

    const shipment = shipmentRes.rows[0];

    if (!shipment) throw new Error("Shipment not found");

    // ✅ get provider slug
    const providerRes = await pool.query(
      `SELECT slug FROM shipping_providers WHERE id = $1`,
      [shipment.provider_id],
    );

    const providerSlug = providerRes.rows[0]?.slug;

    if (!providerSlug) throw new Error("Provider not found");

    const provider = await getShippingProvider(providerSlug);

    console.log('Attempting label generation for shipment external ID:', shipment.external_shipment_id);

    // ❗ OPTIONAL: check if paid
    const orderRes = await pool.query(
      `SELECT shipping_paid FROM store_orders WHERE id = $1`,
      [orderId],
    );

    if (!orderRes.rows[0]?.shipping_paid) {
      throw new Error("Shipment not booked/paid yet");
    }

    console.log('generateLabel shipment === ',shipment);

    const label = await provider.generateLabel(
      shipment.external_shipment_id,
    );

    if (!label?.url) {
      throw new Error("Label not ready yet");
    }

    // ✅ update shipment
    await pool.query(
      `UPDATE shipments SET label_url = $1 WHERE id = $2`,
      [label.url, shipment.id],
    );

    // ✅ update order
    await pool.query(
      `
      UPDATE store_orders
      SET 
        shipping_label = $1,
        label_url = $1,
        fulfillment_status = 'shipped',
        updated_at = NOW()
      WHERE id = $2
      `,
      [label.url, orderId],
    );

    return NextResponse.json({
      success: true,
      labelUrl: label.url,
    });
  } catch (err: any) {
    console.error("❌ [Generate Label API Error]:", err);

    // User-friendly messaging for common gateway lifecycle rejections
    if (err.message?.includes("Order has not status booked")) {
      return NextResponse.json(
        { 
          success: false, 
          error: "This shipment is an unpaid draft on CheapCargo. Please pay for the shipment inside your CheapCargo merchant portal before attempting to render labels." 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: err.message || "Internal label generation engine failure" },
      { status: 500 },
    );
  }
}

/* export async function POST(req: NextRequest) {
  const { shipmentId } = await req.json();

  const shipmentRes = await pool.query(
    `SELECT * FROM shipments WHERE id = $1`,
    [shipmentId],
  );

  const shipment = shipmentRes.rows[0];

  if (!shipment) throw new Error("Shipment not found");

  const provider = await getShippingProvider(shipment.provider_slug);

  const label = await provider.generateLabel(shipment.external_shipment_id);

  await pool.query(
    `
        UPDATE store_orders
        SET 
            tracking_number = $1,
            shipping_label = $2,
            fulfillment_status = 'shipped',
            updated_at = NOW()
        WHERE id = $3
  `,
    [shipment.tracking_number || null, label.url, shipment.order_id],
  );

  if (!label?.url) {
    throw new Error("Label not ready yet");
  }

  await pool.query(`UPDATE shipments SET label_url = $1 WHERE id = $2`, [
    label.url,
    shipmentId,
  ]);

  return NextResponse.json({ success: true, label });
} */



  //   const provider = await getShippingProvider(
  //     shipment.provider_slug,
  //     shipment.store_id
  //   );