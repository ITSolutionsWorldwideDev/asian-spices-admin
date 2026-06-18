// app/api/shipping/track/route.ts
import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/core/db";
import { getCurrentStoreAPI } from "@/lib/auth/guards";
import { getShippingProvider } from "@/lib/shipping/providerFactory";

export async function POST(req: NextRequest) {
  try {
    const store = await getCurrentStoreAPI(req);
    const storeId = store.id;

    const { orderId } = await req.json();

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: "orderId parameter is required" },
        { status: 400 },
      );
    }

    // 1. Fetch shipment details associated with this store tenant
    const shipmentRes = await pool.query(
      `SELECT * FROM shipments WHERE order_id = $1 AND store_id = $2`,
      [orderId, storeId],
    );
    const shipment = shipmentRes.rows[0];

    if (!shipment || !shipment.external_shipment_id) {
      return NextResponse.json(
        { success: false, error: "Active booked shipment record not found for this order" },
        { status: 404 },
      );
    }

    // 2. Resolve provider slug via factory
    const providerRes = await pool.query(
      `SELECT slug FROM shipping_providers WHERE id = $1`,
      [shipment.provider_id],
    );
    const providerSlug = providerRes.rows[0]?.slug;

    if (!providerSlug) throw new Error("Shipping provider configuration profile missing");

    const provider = await getShippingProvider(providerSlug, storeId);

    // 3. Query the carrier gateway for real-time milestones
    const trackingData = await provider.trackShipment(shipment.external_shipment_id);

    // Map carrier strings to your application-wide shipping status metrics safely
    let simplifiedStatus = "booked";
    const statusLower = trackingData.statusName.toLowerCase();

    if (statusLower.includes("delivered")) {
      simplifiedStatus = "delivered";
    } else if (statusLower.includes("transit") || statusLower.includes("sorted") || statusLower.includes("driver")) {
      simplifiedStatus = "shipped";
    } else if (statusLower.includes("cancelled")) {
      simplifiedStatus = "cancelled";
    }else if (statusLower === "new") {
      simplifiedStatus = "pending_payment";
    }

    const isPaidOnGateway = trackingData.paid === true || statusLower === "booked";
    const awbTrackingCode = trackingData.awb || null;

    // 4. Persist tracking metrics downstream into database tables
    await pool.query(
      `
      UPDATE shipments 
      SET 
        status = $1,
        tracking_number = COALESCE($2::TEXT, tracking_number),
        updated_at = NOW() 
      WHERE id = $3
      `,
      [simplifiedStatus, awbTrackingCode, shipment.id],
    );

    await pool.query(
      `
      UPDATE store_orders 
      SET 
        shipping_status = $1,
        shipping_paid = $2,
        tracking_number = COALESCE($3::TEXT, tracking_number),
        updated_at = NOW() 
      WHERE id = $4
      `,
      [simplifiedStatus, isPaidOnGateway, awbTrackingCode, orderId],
    );

    return NextResponse.json({
      success: true,
      statusName: trackingData.statusName,
      statusCode: trackingData.StatusCode,
      mappedStatus: simplifiedStatus,
      isPaid: isPaidOnGateway,
      awb: awbTrackingCode
    });

    // return NextResponse.json({
    //   success: true,
    //   statusName: trackingData.statusName,
    //   statusCode: trackingData.StatusCode,
    //   mappedStatus: simplifiedStatus,
    // });
  } catch (err: any) {
    console.error("Tracking API execution breakdown error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed parsing tracking metrics" },
      { status: 500 },
    );
  }
}