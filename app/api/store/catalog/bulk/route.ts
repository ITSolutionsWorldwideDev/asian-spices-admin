// apps/admin/app/api/store/catalog/bulk/route.ts

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/core/db";
import { getCurrentStoreAPI, requireAuth } from "@/lib/auth/guards";

export async function POST(req: NextRequest) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const body = await req.json();
    const { action = "ASSIGN", selection, filters, data = {} } = body;

    const store = await getCurrentStoreAPI(req);
    const store_id = store.id;

    const sessionDetails = await requireAuth();

    /* ------------------------------------
       Build WHERE clause
    ------------------------------------ */

    let where = `WHERE 1=1`;
    const values: any[] = [store_id];
    let index = 2;

    /* -------- Filters -------- */

    if (filters?.search) {
      values.push(`%${filters.search}%`);
      where += ` AND (p.name ILIKE $${index} OR p.sku ILIKE $${index})`;
      index++;
    }

    if (filters?.category) {
      values.push(filters.category);
      where += ` AND p.category_id = $${index}`;
      index++;
    }

    if (filters?.brand) {
      values.push(filters.brand);
      where += ` AND p.brand_id = $${index}`;
      index++;
    }

    if (filters?.status) {
      values.push(Number(filters.status));
      where += ` AND p.status = $${index}`;
      index++;
    }

    /* -------- Selection Logic -------- */

    if (selection?.ids?.length) {
      values.push(selection.ids);

      if (selection.type === "INCLUDE") {
        where += ` AND p.id = ANY($${index})`;
      } else {
        where += ` AND NOT (p.id = ANY($${index}))`;
      }

      index++;
    }

    /* ------------------------------------
       ACTION HANDLERS
    ------------------------------------ */

    // console.log('action ==== ',action);

    if (action === "RESET_PRICE") {
      if (!selection?.ids?.length) {
        throw new Error("No products selected");
      }

      await client.query(
        `
        UPDATE store_product_catalog spc
        SET price = p.price,
            updated_at = now()
        FROM store_products p
        WHERE spc.product_id = p.id
          AND spc.store_id = $1
          AND spc.product_id = ANY($2::uuid[])
        `,
        [store_id, selection.ids],
      );

      await client.query("COMMIT");

      return NextResponse.json({
        success: true,
        message: "Prices reset to base",
      });
    }

    /* ========= 0. ASSIGN ========= */

    // if (action === "ASSIGN") {
    //   // await client.query(
    //   //   `
    //   //   INSERT INTO store_product_catalog (store_id, product_id)
    //   //   SELECT $1, p.id
    //   //   FROM store_products p
    //   //   WHERE p.id = ANY($2::uuid[])
    //   //   ON CONFLICT (store_id, product_id) DO NOTHING
    //   //   `,
    //   //   [store_id, selection.ids],
    //   // );

    //   if (!filters && (!selection?.ids || selection.ids.length === 0)) {
    //     throw new Error("Bulk assign all products is restricted");
    //   }

    //   await client.query(
    //     `
    //     INSERT INTO store_product_catalog (store_id, product_id)
    //     SELECT $1, p.id
    //     FROM store_products p
    //     ${where}
    //     ON CONFLICT (store_id, product_id) DO NOTHING
    //     `,
    //     values,
    //   );

    //   await client.query("COMMIT");

    //   return NextResponse.json({
    //     success: true,
    //     message: "Products assigned",
    //   });
    // }

    /* ========= 1. UNASSIGN ========= */
    if (action === "UNASSIGN") {
      await client.query(
        `
        DELETE FROM store_product_catalog
        WHERE store_id = $1
        AND product_id = ANY($2::uuid[])
        `,
        [store_id, selection.ids],
      );
      // await client.query(
      //   `
      //   DELETE FROM store_product_catalog spc
      //   USING store_products p
      //   WHERE spc.product_id = p.id
      //   AND spc.store_id = $1
      //   ${where.replace("WHERE", "AND")}
      //   `,
      //   [store_id, ...values],
      // );

      await client.query("COMMIT");

      return NextResponse.json({
        success: true,
        message: "Products unassigned",
      });
    }

    /* ========= 2. UPSERT (Assign + Update together) ========= */

    if (action === "UPSERT") {
      if (!selection?.ids?.length) {
        throw new Error("No products selected for upsert");
      }

      // const price = data?.price ?? 0;
      // const quantity = data?.quantity ?? 0;
      const price = data?.price ?? null;
      const quantity = data?.quantity ?? 999999999;

      await client.query(
        `
        INSERT INTO store_product_catalog 
          (store_id, product_id, price, quantity, status)
        SELECT 
          $1,
          p.id,
          COALESCE($3::numeric, p.price),
          COALESCE($4, 0),
          1
        FROM store_products p
        WHERE p.id = ANY($2::uuid[])

        ON CONFLICT (store_id, product_id)
        DO UPDATE SET
          price = COALESCE(EXCLUDED.price, store_product_catalog.price),
          quantity = COALESCE(EXCLUDED.quantity, store_product_catalog.quantity),
          updated_at = now()
        `,
        [store_id, selection.ids, price, quantity],
      );

      await client.query("COMMIT");

      return NextResponse.json({
        success: true,
        message: "Product assigned/updated successfully",
      });
    }

    /* ========= 2. BULK UPDATE ========= */

    const setUpdates: string[] = [];
    const updateValues: any[] = [];

    if (data?.price !== undefined) {
      setUpdates.push(`price = $${updateValues.length + 2}`);
      updateValues.push(data.price);
    }
    if (data?.quantity !== undefined) {
      setUpdates.push(`quantity = $${updateValues.length + 2}`);
      updateValues.push(data.quantity);
    }

    if (setUpdates.length === 0) {
      await client.query("COMMIT");
      return NextResponse.json({
        success: true,
        message: "No updates to apply",
      });
    }

    let selectionParam: string[] | undefined;
    if (selection?.ids?.length) {
      selectionParam = selection.ids;
    }

    const queryValues: any[] = [store_id, ...updateValues];

    let whereClause = "WHERE 1=1";
    if (filters?.search)
      whereClause += ` AND (p.name ILIKE '%${filters.search}%' OR p.sku ILIKE '%${filters.search}%')`;
    if (selectionParam && selection.type === "INCLUDE")
      whereClause += ` AND p.id = ANY($${queryValues.length + 1}::uuid[])`;
    if (selectionParam && selection.type === "EXCLUDE")
      whereClause += ` AND NOT (p.id = ANY($${queryValues.length + 1}::uuid[]))`;

    // Add selectionParam as last parameter
    if (selectionParam) queryValues.push(selectionParam);

    const query = `
        INSERT INTO store_product_catalog (store_id, product_id, price, quantity, status)
        SELECT 
            $1,
            p.id,
            COALESCE(spc.price, 0),
            COALESCE(spc.quantity, 0),
            COALESCE(spc.status, 1)
        FROM store_products p
        LEFT JOIN store_product_catalog spc 
            ON spc.product_id = p.id AND spc.store_id = $1
        ${whereClause}
        ON CONFLICT (store_id, product_id)
        DO UPDATE SET 
            ${setUpdates.map((f, i) => `${f}`).join(", ")},
            updated_at = now()
    `;

    await client.query(query, queryValues);

    /* ------------
       AUDIT LOG
    --------------- */

    const actor_id = sessionDetails.id; // store.user_id || store.owner_id;

    await client.query(
      `
        INSERT INTO store_audit_logs
        (store_id, actor_id, action, entity, entity_id, changes)
        VALUES ($1, $2, $3, $4, $5, $6)
        `,
      [
        store_id,
        actor_id,
        action,
        "product_catalog",
        null,
        JSON.stringify({
          selection,
          filters,
          data,
        }),
      ],
    );

    await client.query("COMMIT");

    return NextResponse.json({
      success: true,
      message: "Bulk operation successful",
    });
  } catch (e: any) {
    await client.query("ROLLBACK");

    return NextResponse.json(
      {
        error: "Bulk operation failed",
        detail: e.message,
      },
      { status: 500 },
    );
  } finally {
    client.release();
  }
}
