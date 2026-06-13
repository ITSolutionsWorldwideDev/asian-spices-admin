// packages/shipping/service.ts

import { pool } from "@/core/db";
import { getShippingProvider } from "./factory";

export async function createShipment(orderId: string) {
  // 1. Load order
  const { rows } = await pool.query(
    `SELECT * FROM store_orders WHERE id = $1`,
    [orderId]
  );

  const order = rows[0];

  // 2. Get method
  const { rows: methods } = await pool.query(
    `SELECT sm.*, sp.slug 
     FROM shipping_methods sm
     JOIN shipping_providers sp ON sp.id = sm.provider_id
     WHERE sm.id = $1`,
    [order.shipping_method_id]
  );

  const method = methods[0];

  console.log('packages/shipping/service.ts ');

  // 3. Get config
  const { rows: configs } = await pool.query(
    `SELECT * FROM shipping_provider_configs
     WHERE provider_id = $1 AND store_id IS NULL`,
    [method.provider_id]
  );

  const config = configs[0];

  // 4. Provider
  const provider = getShippingProvider(method.slug, config);

  // 5. Create shipment
  const shipment = await provider.createShipment(order);

  // 6. Save shipment
  await pool.query(
    `
    INSERT INTO shipments (
      order_id,
      store_id,
      provider_id,
      external_shipment_id,
      tracking_number,
      label_url,
      raw_response
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7)
    `,
    [
      order.id,
      order.store_id,
      method.provider_id,
      shipment.id,
      shipment.tracking,
      shipment.label_url,
      shipment,
    ]
  );

  return shipment;
}