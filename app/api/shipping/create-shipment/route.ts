// app/api/shipping/create-shipment/route.ts

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/core/db";
import { createShipmentForOrder } from "@/lib/shipping/shippingService";
import { getCurrentStoreAPI } from "@/lib/auth/guards";
import { getShippingProvider } from "@/lib/shipping/providerFactory";
import { validateShipmentRequest } from "@/lib/shipping/validateShipmentRequest";

export async function POST(req: NextRequest) {
  const client = await pool.connect();

  try {
    const store = await getCurrentStoreAPI(req);
    const storeId = store.id;

    const { orderId, shippingMethodId, packagingTypeId, parcels } =
      await req.json();

    if (!orderId || !shippingMethodId) {
      return NextResponse.json(
        { success: false, error: "Missing orderId or shippingMethodId" },
        { status: 400 },
      );
    }

    await client.query("BEGIN");

    // -----------------------------
    // Get order (store-scoped)
    // -----------------------------

    const orderRes = await client.query(
      `
      SELECT 
        o.*,
        c.email AS customer_email,
        COALESCE(json_agg(oi.*) FILTER (WHERE oi.id IS NOT NULL), '[]') AS items
      FROM store_orders o
      INNER JOIN order_item_allocations oia ON oia.order_id = o.id
      LEFT JOIN store_customers c ON c.id = o.customer_id
      LEFT JOIN store_order_items oi ON oi.order_id = o.id
      WHERE o.id = $1 AND oia.store_id = $2
      GROUP BY o.id, c.email
      `,
      [orderId, storeId],
    );

    const order = orderRes.rows[0];

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 },
      );
    }

    // -----------------------------
    // 🚚 Get shipping method + provider
    // -----------------------------

    const methodRes = await client.query(
      `
      SELECT 
        sm.*,
        sp.slug,
        sp.id as provider_id
      FROM store_shipping_providers as shp
	    LEFT JOIN shipping_methods sm ON sm.provider_id = sm.provider_id
      LEFT JOIN shipping_providers sp ON sm.provider_id = sp.id
      WHERE sm.name = $1 AND shp.store_id = $2 AND sm.is_active = true
      `,
      [shippingMethodId, storeId],
    );

    const method = methodRes.rows[0];

    if (!method) throw new Error("Shipping method not found");
    if (!method.provider_id) throw new Error("This method is not API-based");

    console.log("validateShipmentRequest parcels ==== ", parcels);
    console.log("validateShipmentRequest shipping_method_id ==== ", method.id);

    const shipping_method_id = method.id;

    // -----------------------------
    // Validate request (NEW)
    // -----------------------------
    validateShipmentRequest({
      order,
      method,
      parcels,
    });

    // -----------------------------
    // 🧠 Resolve provider + credentials
    // -----------------------------
    const provider = await getShippingProvider(method.slug, storeId);

    if (!provider?.createShipment) {
      throw new Error("Shipping provider not implemented");
    }

    // -----------------------------
    // 🧠 Resolve Store Address
    // -----------------------------

    // email

    const store_address = await client.query(
      `
      SELECT s.name,
             sa.address_line1, sa.address_line2,sa.city,sa.state, sa.postal_code, 
             sa.country, sa.latitude, sa.longitude,
             setg.store_email,setg.store_phone,setg.currency_code
      FROM stores as s
      LEFT JOIN store_addresses as sa on sa.store_id = s.id
      LEFT JOIN store_settings as setg on setg.store_id = s.id
      WHERE s.id = $1 
      limit 1
      `,
      [storeId],
    );

    const store_addressRes = store_address.rows[0];

    if (!store_addressRes) {
      throw new Error("Store Address is missing");
    }

    // -----------------------------
    // 📦 Build shipment input
    // -----------------------------
    const shipmentInput = {
      orderId: order.id,
      to: {
        email: order.customer_email,
        street: order.shipping_address_line1 || order.customer_city,
        number: order.shipping_address_line2 || "",
        city: order.shipping_city || order.customer_city,
        postal_code: order.shipping_postal_code || order.customer_postcode,
        country: order.shipping_country || "NL",
      },
      from: {
        name: order.name,
        street: store_addressRes.address_line1,
        number: store_addressRes.address_line2 || "",
        city: store_addressRes.city,
        postal_code: store_addressRes.postal_code,
        country: store_addressRes.country,
        email: store_addressRes.store_email,
        phone: store_addressRes.store_phone,
        currency_code: store_addressRes.currency_code,
      },
      parcels,
    };

    /* const shipmentInput = {
      orderId: order.id,
      to: {
        email: order.customer_email,
        street: order.shipping_address_line1 || order.customer_city,
        number: order.shipping_address_line2 || "",
        city: order.shipping_city || order.customer_city,
        postal_code: "1000AA",
        country: order.shipping_country || "NL",
      },
      from: {
        name: order.name,
        street: store_addressRes.address_line1,
        number: store_addressRes.address_line2 || "",
        city: store_addressRes.city,
        postal_code: "2000BB",
        country: store_addressRes.country,
        email: store_addressRes.store_email,
        phone: store_addressRes.store_phone,
        currency_code: store_addressRes.currency_code,
      },
      parcels,
    }; */

    /* const shipmentInput = {
      shipments: {
        authentication: "317ad2da332f65569b172c77b9565bda",
        version: "2.1",
        user: {
          email: "user@example.com",
          password: "51f740668efd21ab9ec1d0d382d9746e",
        },
        shipment: [
          {
            "@pay": false,
            "@waitForLabel": false,
            "@id": "E-1887",
            "@orderBy": "price",
            sender: {
              companyName: "My Company",
              contactPerson: "John Sender",
              street: "Hoofdstraat",
              number: "123",
              zipcode: "1000AA",
              city: "Amsterdam",
              country: "NL",
              phone: "+31612345678",
              email: "sender@example.com",
              type: "business",
            },
            receiver: {
              companyName: "Customer Corp",
              contactPerson: "Jane Receiver",
              street: "Kerkstraat",
              number: "456",
              zipcode: "2000BB",
              city: "Rotterdam",
              country: "NL",
              phone: "+31687654321",
              email: "receiver@example.com",
              type: "business",
            },
            content: {
              colli: [
                {
                  description: "Electronics package",
                  weight: 2.5,
                  length: 30,
                  width: 20,
                  height: 15,
                  value: 150,
                  package: "PACKAGE",
                  quantity: 1,
                },
              ],
            },
            reference: "ORDER-2026-001",
          },
        ],
      },
    };
 */
    // -----------------------------
    // 🚀 Create shipment
    // -----------------------------

    const existing = await client.query(
      `SELECT id FROM shipments WHERE order_id = $1 AND store_id = $2`,
      [orderId, storeId],
    );

    // const existing = await client.query(
    //   `SELECT id FROM shipments WHERE order_id = $1`,
    //   [orderId],
    // );

    if (existing.rows.length > 0) {
      throw new Error("Shipment already exists for this order");
    }

    const shipmentResult = await provider.createShipment(shipmentInput);

    if (!shipmentResult?.externalId) {
      throw new Error("Shipment failed: missing externalId");
    }

    // -----------------------------
    // 🏷 Generate label (optional)
    // -----------------------------
    let labelUrl: string | null = shipmentResult.labelUrl || null;
    let paymentUrl: string | null = shipmentResult.paymentUrl || null;

    // -----------------------------
    // 💾 Save shipment
    // -----------------------------
    const shipmentRes = await client.query(
      `
      INSERT INTO shipments
        (order_id, store_id, provider_id, shipping_method_id,
         external_shipment_id, tracking_number, label_url, tracking_url,raw_response,packaging_type_id,payment_url)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      RETURNING *
      `,
      [
        order.id,
        storeId,
        method.provider_id,
        shipping_method_id,
        shipmentResult.externalId,
        shipmentResult.trackingNumber || null,
        labelUrl,
        shipmentResult.trackingUrl || null,
        JSON.stringify(shipmentResult.raw || {}),
        packagingTypeId || null,
        paymentUrl || null,
      ],
    );

    // -----------------------------
    // 🔄 Update order
    // -----------------------------

    const isBooked =
      shipmentResult.raw?.shipment?.order?.[0]?.details?.status === "booked";

    if (isBooked) {
      const orderData = shipmentResult.raw?.shipment?.order?.[0];
      const details = orderData?.details;
      const shippingStatus = details?.status || "new";
      const shippingPaid = orderData?.paid || false;
      const paymentUrl = shipmentResult.raw?.shipment?.url || null;

      await client.query(
        `
          UPDATE store_orders
          SET 
            tracking_number = COALESCE($1, tracking_number),
            shipping_status = $2,
            shipping_paid = COALESCE($3, shipping_paid),
            payment_url = COALESCE($4, payment_url),
            updated_at = NOW()
          WHERE id = $5
        `,
        [
          shipmentResult.trackingNumber || null,
          shippingStatus,
          shippingPaid,
          paymentUrl,
          orderId,
        ],
      );

      // Decrement the store packaging inventory if a fixed template was used
      if (packagingTypeId) {
        const totalBoxesUsed = parseInt(parcels.boxes, 10) || 1;

        const inventoryUpdateRes = await client.query(
          `
          UPDATE store_packaging_inventory
          SET quantity_available = GREATEST(0, quantity_available - $1),
              updated_at = NOW()
          WHERE store_id = $2 AND (packaging_type_id = $3 OR id = $3)
          `,
          [totalBoxesUsed, storeId, packagingTypeId],
        );

        if (inventoryUpdateRes.rowCount === 0) {
          // If no specific store inventory row existed yet, dynamically initialize it as depleted
          await client.query(
            `
            INSERT INTO store_packaging_inventory (store_id, packaging_type_id, quantity_available, minimum_threshold)
            VALUES ($1, $2, 0, 10)
            ON CONFLICT (store_id, packaging_type_id) DO NOTHING
            `,
            [storeId, packagingTypeId],
          );
        }
      }
    }

    await client.query("COMMIT");

    return NextResponse.json({
      success: true,
      shipment: shipmentRes.rows[0],
    });
  } catch (err: any) {
    await client.query("ROLLBACK");

    console.error("create-shipment error:", err);

    return NextResponse.json(
      { success: false, error: err.message || "Server error" },
      { status: 500 },
    );
  } finally {
    client.release();
  }
}
