// app/api/products/link-images/route.ts

import { NextResponse } from "next/server";
import { pool } from "@/core/db";
import { requirePlatformAdmin } from "@/lib/auth/guards";
import {
  buildProductMatchKey,
  filenameToMatchKey,
} from "@/lib/products/imageMatchKey";

export async function POST() {
  await requirePlatformAdmin();

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const [productsRes, mediaRes, linkedRes, withImagesRes] =
      await Promise.all([
        client.query<{ id: number; name: string; weight: string | null }>(
          `SELECT id, name, weight FROM store_products`,
        ),
        client.query<{ media_id: number; file_name: string }>(
          `SELECT media_id, file_name FROM media`,
        ),
        client.query<{ url: string }>(
          `SELECT DISTINCT url FROM store_product_images`,
        ),
        client.query<{ product_id: number }>(
          `SELECT DISTINCT product_id FROM store_product_images`,
        ),
      ]);

    const linkedMediaIds = new Set(
      linkedRes.rows.map((r) => String(r.url)),
    );
    const productsWithImages = new Set(
      withImagesRes.rows.map((r) => r.product_id),
    );

    const productByKey = new Map<string, number>();
    const ambiguous = new Set<string>();

    for (const product of productsRes.rows) {
      const key = buildProductMatchKey(product.name, product.weight);
      if (productByKey.has(key)) {
        ambiguous.add(key);
      } else {
        productByKey.set(key, product.id);
      }
    }

    for (const key of ambiguous) {
      productByKey.delete(key);
    }

    let linked = 0;
    let skipped = 0;
    const unmatched: string[] = [];

    for (const media of mediaRes.rows) {
      const mediaId = String(media.media_id);

      if (linkedMediaIds.has(mediaId)) {
        skipped++;
        continue;
      }

      const productId = productByKey.get(filenameToMatchKey(media.file_name));

      if (!productId) {
        unmatched.push(media.file_name);
        continue;
      }

      if (productsWithImages.has(productId)) {
        skipped++;
        continue;
      }

      await client.query(
        `
        INSERT INTO store_product_images (product_id, url, is_primary, sort_order)
        VALUES ($1, $2, true, 0)
        `,
        [productId, mediaId],
      );

      linked++;
      productsWithImages.add(productId);
      linkedMediaIds.add(mediaId);
    }

    await client.query("COMMIT");

    return NextResponse.json({
      success: true,
      linked,
      skipped,
      unmatchedCount: unmatched.length,
      unmatched: unmatched.slice(0, 30),
    });
  } catch (err: any) {
    await client.query("ROLLBACK");
    return NextResponse.json(
      { error: "Failed to link images", detail: err.message },
      { status: 500 },
    );
  } finally {
    client.release();
  }
}
