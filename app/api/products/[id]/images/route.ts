// app/api/products/[id]/images/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireStorePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { pool } from "@/core/db";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  // await requireStorePermission(PERMISSIONS.MANAGE_PRODUCTS);
  const { id } = await params;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    // const { mediaIds, primaryMediaId } = await req.json();

    const body = await req.json();

    const images = body.images || []; // { url, alt_text, is_primary, sort_order }
    const mediaIds: string[] = body.mediaIds || [];
    const primaryMediaId: string | null = body.primaryMediaId || null;

    if (mediaIds.length) {
      await client.query(
        `DELETE FROM store_product_images WHERE product_id=$1`,
        [id],
      );

      for (const mediaId of mediaIds) {
        await client.query(
          `INSERT INTO store_product_images
           (product_id, url, is_primary)
           VALUES ($1, $2, $3)`,
          [id, mediaId, mediaId === primaryMediaId],
        );
      }
    }

    if (images.length) {
      await client.query(
        `DELETE FROM store_product_images WHERE product_id=$1`,
        [id],
      );

      for (const img of images) {
        await client.query(
          `INSERT INTO store_product_images
           (product_id, url, alt_text, is_primary, sort_order)
           VALUES ($1,$2,$3,$4,$5)`,
          [
            id,
            img.url,
            img.alt_text || "",
            !!img.is_primary,
            img.sort_order || 0,
          ],
        );
      }
    }

    await client.query("COMMIT");
    return NextResponse.json({ success: true });
  } catch (e: any) {
    await client.query("ROLLBACK");
    return NextResponse.json(
      { error: "Failed to attach images", detail: e.message },
      { status: 500 },
    );
  } finally {
    client.release();
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const body = await req.json();

    // Accept either `images` (full objects) or `mediaIds` (frontend selection)
    const images = body.images || []; // { url, alt_text, is_primary, sort_order }
    const mediaIds: string[] = body.mediaIds || [];
    const primaryMediaId: string | null = body.primaryMediaId || null;

    // If frontend sends mediaIds (existing media), insert into DB
    if (mediaIds.length) {
      await client.query(
        `DELETE FROM store_product_images WHERE product_id=$1`,
        [id],
      );

      for (const mediaId of mediaIds) {
        await client.query(
          `INSERT INTO store_product_images
           (product_id, url, is_primary)
           VALUES ($1, $2, $3)`,
          [id, mediaId, mediaId === primaryMediaId],
        );
      }
    }

    // If backend sends full `images` array (custom URLs), insert them
    if (images.length) {
      await client.query(
        `DELETE FROM store_product_images WHERE product_id=$1`,
        [id],
      );

      for (const img of images) {
        await client.query(
          `INSERT INTO store_product_images
           (product_id, url, alt_text, is_primary, sort_order)
           VALUES ($1,$2,$3,$4,$5)`,
          [
            id,
            img.url,
            img.alt_text || "",
            !!img.is_primary,
            img.sort_order || 0,
          ],
        );
      }
    }

    await client.query("COMMIT");
    return NextResponse.json({ success: true });
  } catch (e: any) {
    await client.query("ROLLBACK");
    return NextResponse.json(
      { error: "Failed to attach images", detail: e.message },
      { status: 500 },
    );
  } finally {
    client.release();
  }
}

/* export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
  
) {
  // await requireStorePermission(PERMISSIONS.MANAGE_PRODUCTS);

  const { id } = await params;
  const { images } = await req.json();
  // images = [{ url, alt_text, is_primary, sort_order }]

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await client.query(
      `DELETE FROM store_product_images WHERE product_id=$1`,
      [id]
    );

    for (const img of images) {
      await client.query(
        `
        INSERT INTO store_product_images
        (product_id, url, alt_text, is_primary, sort_order)
        VALUES ($1,$2,$3,$4,$5)
        `,
        [id, img.url, img.alt_text, img.is_primary, img.sort_order]
      );
    }

    await client.query("COMMIT");

    return NextResponse.json({ success: true });
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
} */
