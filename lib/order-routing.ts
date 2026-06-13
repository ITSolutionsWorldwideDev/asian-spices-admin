// apps/admin/lib/order-routing.ts

import { AppError } from "./errors";

type StoreCandidate = {
  store_id: string;
  total_price: number;
  latitude: number;
  longitude: number;
  country: string;
};

type StoreWithDistance = StoreCandidate & {
  distance: number;
};

export const ORDER_EVENTS = {
  ASSIGNED: "assigned",
  REJECTED: "rejected",
  ACCEPTED: "accepted",
  PARTIAL: "partial",
  DEFAULT_ASSIGNED: "default_assigned",
  ADMIN_REASSIGN: "admin_reassign",
  ADMIN_FORCE_ASSIGN: "admin_force_assign",
  CANCELLED: "cancelled",
};

// const DEFAULT_STORE_ID = "YOUR_DEFAULT_STORE_ID";
const DEFAULT_STORE_ID = "afef3fd5-c31a-440a-ae56-99eca0b24359";

export const getCandidateStores = async (
  client: any,
  orderId: string,
  country: string,
): Promise<StoreCandidate[]> => {
  const { rows } = await client.query(
    `
      SELECT 
        spc.store_id,
        COUNT(DISTINCT oi.product_id) as matched_items,
        SUM(spc.price * oi.quantity) AS total_price,
        sa.latitude,
        sa.longitude,
        sa.country
      FROM store_order_items oi
      JOIN store_product_catalog spc 
        ON spc.product_id = oi.product_id
      JOIN store_addresses sa 
        ON sa.store_id = spc.store_id
      WHERE oi.order_id = $1
        AND spc.status = 1
        AND sa.country = $2
        AND spc.quantity >= oi.quantity
      GROUP BY spc.store_id, sa.latitude, sa.longitude, sa.country
      HAVING COUNT(DISTINCT oi.product_id) = (
        SELECT COUNT(DISTINCT product_id)
        FROM store_order_items
        WHERE order_id = $1
      )
    `,
    [orderId, country],
  );

  return rows;
};

const getDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const sortStores = (
  stores: StoreCandidate[],
  lat: number,
  lng: number,
): StoreWithDistance[] => {
  return stores
    .map((s) => ({
      ...s,
      total_price: Number(s.total_price),
      latitude: Number(s.latitude),
      longitude: Number(s.longitude),
      distance: getDistance(lat, lng, Number(s.latitude), Number(s.longitude)),
    }))
    .sort((a, b) => {
      if (a.total_price !== b.total_price) {
        return a.total_price - b.total_price;
      }
      return a.distance - b.distance;
    });
};

export const assignDefaultStore = async (client: any, orderId: string) => {
  if (!DEFAULT_STORE_ID) {
    throw new AppError(
      "Default store not configured",
      "DEFAULT_STORE_MISSING",
      500,
    );
  }

  await client.query(
    `
    UPDATE store_orders
    SET current_store_id = $1,
        routing_status = 'assigned'
    WHERE id = $2
  `,
    [DEFAULT_STORE_ID, orderId],
  );

  await logOrderEvent(client, {
    orderId,
    // eventType: "default_assigned",
    eventType: ORDER_EVENTS.DEFAULT_ASSIGNED,
    storeId: DEFAULT_STORE_ID,
    message: "Assigned to default store after retries",
  });
};

const createAllocations = async (
  client: any,
  orderId: string,
  storeId: string,
) => {
  await client.query(
    `
    INSERT INTO order_item_allocations
    (order_id, order_item_id, store_id, allocated_quantity, fulfilled_quantity, status)
    SELECT 
      $1,
      oi.id,
      $2,
      (oi.quantity - COALESCE(oi.fulfilled_quantity,0)) as remaining,
      0,
      'pending'
    FROM store_order_items oi
    WHERE oi.order_id = $1
      AND (oi.quantity - COALESCE(oi.fulfilled_quantity,0)) > 0
    `,
    [orderId, storeId],
  );
};

export const resolveOrderStatus = async (client: any, orderId: string) => {
  const { rows } = await client.query(
    `
      SELECT 
        COALESCE(SUM(quantity),0) as total,
        COALESCE(SUM(fulfilled_quantity),0) as fulfilled
      FROM store_order_items
      WHERE order_id = $1
    `,
    [orderId],
  );

  const total = Number(rows[0].total || 0);
  const fulfilled = Number(rows[0].fulfilled || 0);

  let orderStatus = "pending";
  let fulfillmentStatus = "pending";

  if (fulfilled === 0) {
    orderStatus = "pending";
    fulfillmentStatus = "pending";
  } else if (fulfilled < total) {
    orderStatus = "partially_confirmed";
    fulfillmentStatus = "partial";
  } else {
    orderStatus = "confirmed";
    fulfillmentStatus = "fulfilled";
  }

  await client.query(
    `
      UPDATE store_orders
      SET order_status = $1,
          fulfillment_status = $2
      WHERE id = $3
    `,
    [orderStatus, fulfillmentStatus, orderId],
  );
};

export const logOrderEvent = async (
  client: any,
  {
    orderId,
    eventType,
    storeId = null,
    message = "",
    metadata = {},
  }: {
    orderId: string;
    eventType: string;
    storeId?: string | null;
    message?: string;
    metadata?: Record<string, any>;
  },
) => {
  await client.query(
    `
    INSERT INTO order_events
    (order_id, event_type, store_id, message, metadata)
    VALUES ($1,$2,$3,$4,$5)
  `,
    [orderId, eventType, storeId, message, metadata],
  );
};

export const isTimeoutExceeded = async (client: any, attempt: any) => {
  const { store_id, created_at } = attempt;

  // get working hours
  const { rows } = await client.query(
    `
    SELECT * FROM store_working_hours
    WHERE store_id = $1
  `,
    [store_id],
  );

  const now = new Date();
  let activeMinutes = 0;

  let cursor = new Date(created_at);

  while (cursor < now) {
    const day = cursor.getDay();

    const hours = rows.find((r: any) => r.day_of_week === day);
    if (!hours || hours.is_closed) {
      cursor.setDate(cursor.getDate() + 1);
      cursor.setHours(0, 0, 0, 0);
      continue;
    }

    const open = new Date(cursor);
    const close = new Date(cursor);

    const [oh, om] = hours.open_time.split(":");
    const [ch, cm] = hours.close_time.split(":");

    open.setHours(+oh, +om, 0);
    close.setHours(+ch, +cm, 0);

    const start = cursor > open ? cursor : open;
    const end = now < close ? now : close;

    if (end > start) {
      activeMinutes += (end.getTime() - start.getTime()) / 60000;
    }

    cursor = new Date(close);
    cursor.setMinutes(cursor.getMinutes() + 1);
  }

  return activeMinutes >= 60;
};

export const isStoreOpenNow = async (client: any, storeId: string) => {
  const now = new Date();

  const day = now.getDay(); // 0-6
  const currentTime = now.toTimeString().slice(0, 5); // HH:mm

  const { rows } = await client.query(
    `
    SELECT open_time, close_time, is_closed
    FROM store_working_hours
    WHERE store_id = $1 AND day_of_week = $2
    `,
    [storeId, day],
  );

  if (!rows.length) return false;

  const wh = rows[0];
  if (wh.is_closed) return false;

  // console.log(
  //   "isStoreOpenNow currentTime === ",
  //   currentTime >= wh.open_time && currentTime <= wh.close_time,
  // );

  return currentTime >= wh.open_time && currentTime <= wh.close_time;
};

export const getStoresThatCanFulfillAllItems = async (
  client: any,
  orderId: string,
  country: string,
) => {
  const { rows } = await client.query(
    `
    SELECT 
      spc.store_id,
      COUNT(DISTINCT oi.product_id) as matched_items,
      SUM(
        spc.price * 
        (oi.quantity - COALESCE(oi.fulfilled_quantity,0))
      ) AS total_price,
      sa.latitude,
      sa.longitude,
      sa.country
    FROM store_order_items oi
    JOIN store_product_catalog spc 
      ON spc.product_id = oi.product_id
    JOIN store_addresses sa 
      ON sa.store_id = spc.store_id
    WHERE oi.order_id = $1
      AND COALESCE(oi.fulfilled_quantity,0) < oi.quantity
      AND spc.status = 1
      AND sa.country = $2
      AND spc.quantity >= (oi.quantity - COALESCE(oi.fulfilled_quantity,0))
    GROUP BY spc.store_id, sa.latitude, sa.longitude, sa.country
    HAVING COUNT(DISTINCT oi.product_id) = (
      SELECT COUNT(DISTINCT product_id)
      FROM store_order_items
      WHERE order_id = $1
      AND COALESCE(fulfilled_quantity,0) < quantity
    )
    `,
    [orderId, country],
  );

  return rows;
};

// AND spc.quantity >= oi.quantity
// SUM(spc.price * oi.quantity) AS total_price,

export const getStoresWithPartialItems = async (
  client: any,
  orderId: string,
  country: string,
) => {
  const { rows } = await client.query(
    `
    SELECT 
      spc.store_id,
      oi.product_id,
      oi.quantity,
      spc.price,
      sa.latitude,
      sa.longitude
    FROM store_order_items oi
    JOIN store_product_catalog spc 
      ON spc.product_id = oi.product_id
    JOIN store_addresses sa 
      ON sa.store_id = spc.store_id
    WHERE oi.order_id = $1
      AND spc.status = 1
      AND sa.country = $2
      AND spc.quantity > 0
    `,
    [orderId, country],
  );

  return rows;
};

export const assignNextStore = async (client: any, orderId: string) => {
  const { rows } = await client.query(
    `SELECT * FROM store_orders WHERE id = $1`,
    [orderId],
  );

  const order = rows[0];

  if (!order) throw new Error("Order not found");

  // ✅ 4️⃣ fallback rule
  if (order.rejection_count >= 3) {
    return assignDefaultStore(client, orderId);
  }

  // ✅ only FULL stores
  const stores = await getStoresThatCanFulfillAllItems(
    client,
    orderId,
    order.country,
  );

  if (!stores.length) {
    // ❗ fallback to multi-store
    return assignMultiStore(client, orderId);
  }

  const sorted = sortStores(stores, order.latitude, order.longitude);

  const { rows: attempts } = await client.query(
    `SELECT store_id FROM order_routing_attempts WHERE order_id = $1 AND status = 'rejected'`,
    [orderId],
  );

  const tried = attempts.map((a: any) => a.store_id);

  const nextStore = sorted.find((s) => !tried.includes(s.store_id));

  if (!nextStore) {
    return assignDefaultStore(client, orderId);
  }

  await client.query(
    `UPDATE store_orders
     SET current_store_id = $1,
         routing_status = 'assigned'
     WHERE id = $2`,
    [nextStore.store_id, orderId],
  );

  await createAllocations(client, orderId, nextStore.store_id);

  await client.query(
    `INSERT INTO order_routing_attempts (order_id, store_id, attempt_number)
     VALUES ($1,$2,$3)`,
    [orderId, nextStore.store_id, attempts.length + 1],
  );

  await logOrderEvent(client, {
    orderId,
    eventType: ORDER_EVENTS.ASSIGNED,
    storeId: nextStore.store_id,
  });
};

export const assignMultiStore = async (client: any, orderId: string) => {
  const { rows: orderItems } = await client.query(
    `SELECT * FROM store_order_items WHERE order_id = $1`,
    [orderId],
  );

  // already attempted stores
  const { rows: attempts } = await client.query(
    `
    SELECT DISTINCT store_id
    FROM order_routing_attempts
    WHERE order_id = $1
    `,
    [orderId],
  );

  const triedStoreIds = attempts.map((a: any) => a.store_id);

  for (const item of orderItems) {
    // ✅ ONLY remaining qty
    // let remaining = item.quantity;
    let remaining = item.quantity - (item.fulfilled_quantity || 0);

    // fully completed item
    if (remaining <= 0) {
      continue;
    }

    // candidate stores
    const { rows: stores } = await client.query(
      `
      SELECT spc.store_id, spc.quantity, spc.price
      FROM store_product_catalog spc
      WHERE spc.product_id = $1
        AND spc.quantity > 0
        AND spc.store_id != ALL($2)
      ORDER BY spc.price ASC
      `,
      [item.product_id, triedStoreIds],
      // [item.product_id],
    );

    for (const store of stores) {
      if (remaining <= 0) break;

      const allocateQty = Math.min(remaining, store.quantity);

      await client.query(
        `
        INSERT INTO order_item_allocations
        (
          order_id,
          order_item_id,
          store_id,
          allocated_quantity,
          fulfilled_quantity,
          status
        )
        VALUES ($1,$2,$3,$4,0,'pending')
        ON CONFLICT (order_id, order_item_id, store_id) 
        DO UPDATE SET
          allocated_quantity = EXCLUDED.allocated_quantity,
          status = 'pending'
        `,
        [orderId, item.id, store.store_id, allocateQty],
      );

      // routing attempt
      await client.query(
        `
        INSERT INTO order_routing_attempts
        (
          order_id,
          store_id,
          attempt_number,
          status
        )
        VALUES (
          $1,
          $2,
          COALESCE(
            (
              SELECT MAX(attempt_number) + 1
              FROM order_routing_attempts
              WHERE order_id = $1
            ),
            1
          ),
          'pending'
        )
        ON CONFLICT DO NOTHING
        `,
        [orderId, store.store_id],
      );

      remaining -= allocateQty;
    }

    // ❗ fallback rule #1
    if (remaining > 0) {
      await client.query(
        `
        INSERT INTO order_item_allocations
        (
          order_id,
          order_item_id,
          store_id,
          allocated_quantity,
          fulfilled_quantity,
          status
        )
        VALUES ($1,$2,$3,$4,0,'pending')
        ON CONFLICT (order_id, order_item_id, store_id) 
        DO UPDATE SET
          allocated_quantity = EXCLUDED.allocated_quantity,
          status = 'pending'
        `,
        [orderId, item.id, DEFAULT_STORE_ID, remaining],
      );
    }
  }

  await client.query(
    `UPDATE store_orders
     SET routing_status = 'split'
     WHERE id = $1`,
    [orderId],
  );

  await logOrderEvent(client, {
    orderId,
    eventType: ORDER_EVENTS.PARTIAL,
    message: "Order split across multiple stores",
  });
};

/* export const assignNextStore = async (client: any, orderId: string) => {
  try {
    const { rows: orderRows } = await client.query(
      `SELECT o.*, ss.country_code as country
       FROM store_orders AS o
       LEFT JOIN store_settings ss ON ss.store_id = o.current_store_id
       WHERE o.id = $1`,
      [orderId],
    );

    const order = orderRows[0];

    if (!order) {
      throw new AppError("Order not found", "ORDER_NOT_FOUND", 404);
    }

    if (order.rejection_count >= 3) {
      await assignDefaultStore(client, orderId);
      return;
    }

    const stores = await getCandidateStores(client, orderId, order.country);

    if (!stores.length) {
      throw new AppError(
        "No stores available for this order",
        "NO_STORES",
        400,
      );
    }

    const availableStores = [];

    for (const store of stores) {
      const isOpen = await isStoreOpenNow(client, store.store_id);

      // console.log("assignNextStore isOpen ==== ", isOpen);

      if (isOpen) {
        availableStores.push(store);
      }
    }

    // console.log("assignNextStore availableStores ==== ", availableStores);

    if (availableStores.length === 0) {
      await logOrderEvent(client, {
        orderId,
        eventType: ORDER_EVENTS.DEFAULT_ASSIGNED,
        message: "All stores closed — assigned to default",
      });

      return assignDefaultStore(client, orderId);
    }

    // const sorted = sortStores(stores, order.latitude, order.longitude);
    const sorted = sortStores(availableStores, order.latitude, order.longitude);

    const { rows: attempts } = await client.query(
      `SELECT store_id FROM order_routing_attempts WHERE order_id = $1`,
      [orderId],
    );

    const tried = attempts.map((a: { store_id: string }) => a.store_id);

    const nextStore = sorted.find((s) => !tried.includes(s.store_id));

    if (!nextStore) {
      await assignDefaultStore(client, orderId);
      return;
    }

    await client.query(
      `
        UPDATE store_orders
        SET current_store_id = $1,
            routing_status = 'assigned'
        WHERE id = $2
      `,
      [nextStore.store_id, orderId],
    );

    // Scenrio 3: Partial allocation

    await createAllocations(client, orderId, nextStore.store_id);

    await client.query(
      `
        INSERT INTO order_routing_attempts
        (order_id, store_id, attempt_number)
        VALUES ($1,$2,$3)
      `,
      [orderId, nextStore.store_id, attempts.length + 1],
    );

    await logOrderEvent(client, {
      orderId,
      // eventType: "assigned",
      eventType: ORDER_EVENTS.ASSIGNED,
      storeId: nextStore.store_id,
      message: "Order assigned to store",
      metadata: {
        price: nextStore.total_price,
        distance: nextStore.distance,
      },
    });
  } catch (err) {
    console.error("assignNextStore err ==== ", err);
    throw err;
  }
}; */

/* const { rows } = await client.query(
    `
      SELECT 
        spc.store_id,
        SUM(spc.price * oi.quantity) AS total_price,
        sa.latitude,
        sa.longitude,
        sa.country
      FROM store_order_items oi
      JOIN store_product_catalog spc ON spc.product_id = oi.product_id
      JOIN store_addresses sa ON sa.store_id = spc.store_id
      WHERE oi.order_id = $1
        AND spc.status = 1
        AND sa.country = $2
      GROUP BY spc.store_id, sa.latitude, sa.longitude, sa.country
    `,
    [orderId, country],
  ); */
