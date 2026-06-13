// packages/packaging-service/src/index.ts

import { PoolClient } from "pg";

// =========================================================
//    TYPES
// =========================================================

export type PackagingTypeInput = {
  sku: string;
  name: string;
  package_type: string;

  description?: string;

  length_cm: number;
  width_cm: number;
  height_cm: number;

  empty_weight_kg?: number;
  max_weight_kg?: number;

  material?: string;
  color?: string;

  is_fragile?: boolean;
};

export type AssignPackagingInput = {
  storeId: string;
  packagingTypeId: string;
  quantity: number;
  minimumThreshold?: number;
};

export type PackagingSelectionInput = {
  storeId: string;
  totalWeightKg: number;

  lengthCm: number;
  widthCm: number;
  heightCm: number;
};

export type PackagingMovementInput = {
  storeId?: string;

  packagingTypeId?: string;
  ribbonId?: string;
  addonId?: string;

  movementType:
    | "stock_in"
    | "stock_out"
    | "order_consumed"
    | "damaged"
    | "returned"
    | "manual_adjustment";

  quantity: number;

  referenceType?: string;
  referenceId?: string;

  notes?: string;

  createdBy?: string;
};

// =========================================================
//    CREATE PACKAGING TYPE
// =========================================================

export const createPackagingType = async (
  client: PoolClient,
  input: PackagingTypeInput,
) => {
  const { rows } = await client.query(
    `
    INSERT INTO packaging_types
    (
      sku,
      name,
      package_type,
      description,

      length_cm,
      width_cm,
      height_cm,

      empty_weight_kg,
      max_weight_kg,

      material,
      color,

      is_fragile
    )

    VALUES
    (
      $1,$2,$3,$4,
      $5,$6,$7,
      $8,$9,
      $10,$11,
      $12
    )

    RETURNING *
  `,
    [
      input.sku,
      input.name,
      input.package_type,
      input.description || null,

      input.length_cm,
      input.width_cm,
      input.height_cm,

      input.empty_weight_kg || 0,
      input.max_weight_kg || null,

      input.material || null,
      input.color || null,

      input.is_fragile || false,
    ],
  );

  return rows[0];
};

// =========================================================
//    UPDATE PACKAGING TYPE
// =========================================================

const ALLOWED_TYPE_FIELDS = new Set([
  "sku",
  "name",
  "package_type",
  "description",
  "length_cm",
  "width_cm",
  "height_cm",
  "empty_weight_kg",
  "max_weight_kg",
  "material",
  "color",
  "is_fragile",
]);

export const updatePackagingType = async (
  client: PoolClient,
  packagingTypeId: string,
  updates: Partial<PackagingTypeInput>,
) => {
  const fields: string[] = [];
  const values: any[] = [];
  let index = 1;

  for (const [key, value] of Object.entries(updates)) {
    if (value === undefined) continue;

    // Strict lookup defense against parameter/key injection
    if (!ALLOWED_TYPE_FIELDS.has(key)) {
      throw new Error(`Invalid or restricted update column key: ${key}`);
    }

    fields.push(`${key} = $${index}`);
    values.push(value);
    index++;
  }

  if (fields.length === 0) return null;

  values.push(packagingTypeId);

  const { rows } = await client.query(
    `
    UPDATE packaging_types
    SET
      ${fields.join(", ")},
      updated_at = NOW()
    WHERE id = $${index}
    RETURNING *
  `,
    values,
  );

  return rows[0];
};

// =========================================================
//    GET PACKAGING TYPES
// =========================================================

export const getPackagingTypes = async (client: PoolClient) => {
  const { rows } = await client.query(
    `
    SELECT *
    FROM packaging_types
    WHERE is_active = true
    ORDER BY created_at DESC
  `,
  );

  return rows;
};

// =========================================================
//    ASSIGN INVENTORY TO STORE
// =========================================================

export const assignPackagingToStore = async (
  client: PoolClient,
  input: AssignPackagingInput,
) => {
  const { rows } = await client.query(
    `
    INSERT INTO store_packaging_inventory
    (
      store_id,
      packaging_type_id,
      quantity_available,
      minimum_threshold
    )

    VALUES ($1,$2,$3,$4)

    ON CONFLICT
    (
      store_id,
      packaging_type_id
    )

    DO UPDATE
    SET
      quantity_available =
        store_packaging_inventory.quantity_available + EXCLUDED.quantity_available,

      minimum_threshold = EXCLUDED.minimum_threshold,

      updated_at = NOW()

    RETURNING *
  `,
    [
      input.storeId,
      input.packagingTypeId,
      input.quantity,
      input.minimumThreshold || 0,
    ],
  );

  await logPackagingMovement(client, {
    storeId: input.storeId,
    packagingTypeId: input.packagingTypeId,

    movementType: "stock_in",

    quantity: input.quantity,

    referenceType: "admin",
  });

  return rows[0];
};

// =========================================================
//    GET STORE PACKAGING INVENTORY
// =========================================================

export const getStorePackagingInventory = async (
  client: PoolClient,
  storeId: string,
) => {
  const { rows } = await client.query(
    `
      SELECT
        spi.*,

        pt.name,
        pt.sku,
        pt.package_type,

        pt.length_cm,
        pt.width_cm,
        pt.height_cm

      FROM store_packaging_inventory spi

      JOIN packaging_types pt
        ON pt.id = spi.packaging_type_id

      WHERE spi.store_id = $1

      ORDER BY pt.name ASC
    `,
    [storeId],
  );

  return rows;
};

// =========================================================
//    LOG INVENTORY MOVEMENT
// =========================================================

export const logPackagingMovement = async (
  client: PoolClient,
  input: PackagingMovementInput,
) => {
  const { rows } = await client.query(
    `
      INSERT INTO packaging_inventory_movements
      (
        store_id,

        packaging_type_id,
        ribbon_id,
        addon_id,

        movement_type,
        quantity,

        reference_type,
        reference_id,

        notes,
        created_by
      )

      VALUES
      (
        $1,
        $2,
        $3,
        $4,

        $5,
        $6,

        $7,
        $8,

        $9,
        $10
      )

      RETURNING *
    `,
    [
      input.storeId || null,

      input.packagingTypeId || null,
      input.ribbonId || null,
      input.addonId || null,

      input.movementType,
      input.quantity,

      input.referenceType || null,
      input.referenceId || null,

      input.notes || null,
      input.createdBy || null,
    ],
  );

  return rows[0];
};

// =========================================================
//    CONSUME PACKAGING
// =========================================================

export const consumePackagingInventory = async (
  client: PoolClient,
  {
    storeId,
    packagingTypeId,
    quantity,
    orderId,
    userId,
  }: {
    storeId: string;
    packagingTypeId: string;
    quantity: number;

    orderId?: string;
    userId?: string;
  },
) => {
  const inventory = await client.query(
    `
      SELECT *
      FROM store_packaging_inventory
      WHERE store_id = $1
        AND packaging_type_id = $2
      LIMIT 1
    `,
    [storeId, packagingTypeId],
  );

  if (!inventory.rowCount) {
    throw new Error("Packaging inventory not found");
  }

  const current = inventory.rows[0].quantity_available;

  if (current < quantity) {
    throw new Error("Insufficient packaging inventory");
  }

  await client.query(
    `
      UPDATE store_packaging_inventory
      SET
        quantity_available =
          quantity_available - $1,

        updated_at = NOW()

      WHERE store_id = $2
        AND packaging_type_id = $3
    `,
    [quantity, storeId, packagingTypeId],
  );

  await logPackagingMovement(client, {
    storeId,
    packagingTypeId,

    movementType: "order_consumed",

    quantity,

    referenceType: "order",
    referenceId: orderId,

    createdBy: userId,
  });

  return true;
};

// =========================================================
//    AUTO SELECT BEST PACKAGE
// =========================================================

export const autoSelectPackaging = async (
  client: PoolClient,
  input: PackagingSelectionInput,
) => {
  const { rows } = await client.query(
    `
      SELECT pt.*, pr.priority

      FROM packaging_rules pr

      JOIN packaging_types pt
        ON pt.id = pr.packaging_type_id

      WHERE pr.is_active = true

        AND (pr.store_id = $1 OR pr.store_id IS NULL)

        AND (
          pr.min_weight_kg IS NULL
          OR $2 >= pr.min_weight_kg
        )

        AND (
          pr.max_weight_kg IS NULL
          OR $2 <= pr.max_weight_kg
        )

        AND (
          pr.min_length_cm IS NULL
          OR $3 >= pr.min_length_cm
        )

        AND (
          pr.max_length_cm IS NULL
          OR $3 <= pr.max_length_cm
        )

        AND (
          pr.min_width_cm IS NULL
          OR $4 >= pr.min_width_cm
        )

        AND (
          pr.max_width_cm IS NULL
          OR $4 <= pr.max_width_cm
        )

        AND (
          pr.min_height_cm IS NULL
          OR $5 >= pr.min_height_cm
        )

        AND (
          pr.max_height_cm IS NULL
          OR $5 <= pr.max_height_cm
        )

      ORDER BY pr.priority ASC

      LIMIT 1
    `,
    [input.storeId, input.totalWeightKg, input.lengthCm, input.widthCm, input.heightCm],
  );

  return rows[0] || null;
};

// =========================================================
//    CREATE ORDER PACKAGING
// =========================================================

export const createOrderPackaging = async (
  client: PoolClient,
  {
    orderId,
    storeId,
    packagingTypeId,
    ribbonId,
    packagingCost,
    totalWeightKg,
    packedBy,
  }: {
    orderId: string;
    storeId: string;

    packagingTypeId: string;

    ribbonId?: string;

    packagingCost?: number;

    totalWeightKg?: number;

    packedBy?: string;
  },
) => {
  const { rows } = await client.query(
    `
      INSERT INTO order_packaging
      (
        order_id,
        store_id,

        packaging_type_id,
        ribbon_id,

        packaging_cost,

        total_package_weight_kg,

        packed_by
      )

      VALUES
      (
        $1,$2,
        $3,$4,
        $5,$6,$7
      )

      RETURNING *
    `,
    [
      orderId,
      storeId,

      packagingTypeId,
      ribbonId || null,

      packagingCost || 0,

      totalWeightKg || 0,

      packedBy || null,
    ],
  );

  return rows[0];
};

// =========================================================
//    MARK PACKAGE AS PACKED
// =========================================================

export const markOrderPacked = async (
  client: PoolClient,
  orderPackagingId: string,
  packedBy: string,
) => {
  const { rows } = await client.query(
    `
      UPDATE order_packaging
      SET
        packaging_status = 'packed',

        packed_by = $1,

        packed_at = NOW()

      WHERE id = $2

      RETURNING *
    `,
    [packedBy, orderPackagingId],
  );

  return rows[0];
};

// =========================================================
//    LOW STOCK ALERTS
// =========================================================

export const getLowPackagingStock = async (client: PoolClient) => {
  const { rows } = await client.query(
    `
      SELECT
        spi.*,

        s.name AS store_name,

        pt.name AS packaging_name,
        pt.sku

      FROM store_packaging_inventory spi

      JOIN stores s
        ON s.id = spi.store_id

      JOIN packaging_types pt
        ON pt.id = spi.packaging_type_id

      WHERE
        spi.quantity_available
          <= spi.minimum_threshold

      ORDER BY spi.quantity_available ASC
    `,
  );

  return rows;
};

// =========================================================
//    GET PACKAGING MOVEMENTS
// =========================================================

export const getPackagingMovements = async (
  client: PoolClient,
  {
    storeId,
    packagingTypeId,
    limit = 100,
  }: {
    storeId?: string;
    packagingTypeId?: string;
    limit?: number;
  },
) => {
  const conditions: string[] = [];
  const values: any[] = [];

  let index = 1;

  if (storeId) {
    conditions.push(`pim.store_id = $${index}`);
    values.push(storeId);
    index++;
  }

  if (packagingTypeId) {
    conditions.push(`pim.packaging_type_id = $${index}`);
    values.push(packagingTypeId);
    index++;
  }

  values.push(limit);

  const whereClause = conditions.length
    ? `WHERE ${conditions.join(" AND ")}`
    : "";

  const { rows } = await client.query(
    `
      SELECT
        pim.*,

        pt.name AS packaging_name,
        pt.sku,

        s.name AS store_name

      FROM packaging_inventory_movements pim

      LEFT JOIN packaging_types pt
        ON pt.id = pim.packaging_type_id

      LEFT JOIN stores s
        ON s.id = pim.store_id

      ${whereClause}

      ORDER BY pim.created_at DESC

      LIMIT $${index}
    `,
    values,
  );

  return rows;
};
