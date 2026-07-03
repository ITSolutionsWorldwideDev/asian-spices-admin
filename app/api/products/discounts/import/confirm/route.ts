// app/api/products/discounts/import/confirm/route.ts

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/core/db";
import { requirePlatformAdmin } from "@/lib/auth/guards";

type ImportRow = {
  row: number;
  data: any;
  isValid: boolean;
  errors: string[];
};

export async function POST(req: NextRequest) {
  await requirePlatformAdmin();
  const client = await pool.connect();

  try {
    const body: { rows: ImportRow[] } = await req.json();

    if (!body?.rows?.length) {
      return NextResponse.json(
        { error: "No computational table mutation lines provided" },
        { status: 400 },
      );
    }

    // Load fresh target database map mapping keys to prevent data race shifts
    const existingProducts = await client.query(
      `SELECT sku, id FROM store_products`,
    );
    const skuToIdMap = new Map<string, string>(
      existingProducts.rows.map((r: { sku: string; id: string }) => [
        r.sku.toLowerCase().trim(),
        r.id,
      ]),
    );

    await client.query("BEGIN");

    let inserted = 0;
    let skipped = 0;
    const errors: any[] = [];

    for (const r of body.rows) {
      try {
        if (!r.isValid) {
          skipped++;
          continue;
        }

        const row = r.data;
        const targetProductId = skuToIdMap.get(
          String(row.SKU).toLowerCase().trim(),
        );

        if (!targetProductId) {
          throw new Error(
            "Unable to locate system primary identity key tracking row correlation index map",
          );
        }

        /* Execute a structural relational insert sequence or fall back 
           on an upsert mutation override path if matching historical definitions occur.
        */
        await client.query(
          `
          INSERT INTO public.store_product_discount (
            product_id, 
            customer_type, 
            discount_type, 
            discount_value, 
            promo_code, 
            status, 
            updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, NOW())
          ON CONFLICT (id) 
          DO UPDATE SET
            discount_type = EXCLUDED.discount_type,
            discount_value = EXCLUDED.discount_value,
            promo_code = EXCLUDED.promo_code,
            status = EXCLUDED.status,
            updated_at = NOW()
          `,
          [
            targetProductId,
            String(row["Customer Type"]).toUpperCase().trim(),
            String(row["Discount Type"]).toUpperCase().trim(),
            Number(row["Discount Value"]),
            row["Promo Code"] ? String(row["Promo Code"]).trim() : null,
            row.Status === "Inactive" ? 0 : 1,
          ],
        );

        inserted++;
      } catch (err: any) {
        errors.push({
          row: r.row,
          error: err.message,
        });
        skipped++;
      }
    }

    await client.query("COMMIT");

    return NextResponse.json({
      success: true,
      inserted,
      skipped,
      failed: errors.length,
      errors,
    });
  } catch (err: any) {
    await client.query("ROLLBACK");
    return NextResponse.json(
      {
        error: "Discount matrix execution failed completely",
        detail: err.message,
      },
      { status: 500 },
    );
  } finally {
    client.release();
  }
}
