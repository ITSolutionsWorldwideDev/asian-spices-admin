// apps/admin/app/api/platform/shipping/providers/route.ts

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/core/db";
import { encrypt } from "@/lib/crypto";
import { requirePlatformAdmin } from "@/lib/auth/guards";

import { providerSchema } from "@/lib/validations/provider";
import { validateProviderCredentials } from "@/lib/validations/validateProviderCredentials";
import { normalizeCredentials } from "@/lib/utils/normalizeCredentials";

export async function POST(req: NextRequest) {
  const client = await pool.connect();

  try {
    await requirePlatformAdmin();
    await client.query("BEGIN");

    const body = await req.json();

    // ✅ Zod validation
    const parsed = providerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { name, slug, is_active } = parsed.data;

    const credentials = normalizeCredentials(parsed.data.credentials);

    validateProviderCredentials(slug, credentials);

    const result = await client.query(
      `
      INSERT INTO shipping_providers (name, slug, is_active)
      VALUES ($1, $2, $3)
      RETURNING id
      `,
      [name, slug, is_active],
    );

    const providerId = result.rows[0].id;

    const encrypted: Record<string, string> = {};

    for (const [key, value] of Object.entries(credentials)) {
      encrypted[key] = encrypt(value);
    }

    await client.query(
      `
      INSERT INTO shipping_provider_configs (provider_id, store_id, extra, is_active)
      VALUES ($1, NULL, $2, $3)
      `,
      [providerId, 
        // encrypted,
        credentials, 
        is_active],
    );

    // await client.query(
    //   `
    //   INSERT INTO shipping_provider_credentials (provider_id, metadata)
    //   VALUES ($1, $2)
    //   `,
    //   [providerId, encrypted],
    // );

    await client.query("COMMIT");

    return NextResponse.json({ success: true });
  } catch (err) {
    await client.query("ROLLBACK");

    console.error(err);

    if (isPgError(err) && err.code === "23505") {
      return NextResponse.json(
        { success: false, error: "Slug already exists" },
        { status: 400 },
      );
    }

    const message =
      isPgError(err) && err.message ? err.message : "Failed to create provider";

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  } finally {
    client.release();
  }
}

function isPgError(err: unknown): err is { code?: string; message?: string } {
  return typeof err === "object" && err !== null;
}

// -----------------------------
// UPDATE PROVIDER
// -----------------------------
export async function PUT(req: NextRequest) {
  const client = await pool.connect();

  try {
    await requirePlatformAdmin();

    await client.query("BEGIN");

    const body = await req.json();
    const parsed = providerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { id, name, slug, is_active } = parsed.data;

    const credentials = normalizeCredentials(parsed.data.credentials);

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Missing provider id" },
        { status: 400 },
      );
    }

    // ✅ Dynamic validation
    validateProviderCredentials(slug, credentials);

    // const { id, name, slug, is_active, credentials } = await req.json();

    await client.query(
      `
      UPDATE shipping_providers
      SET name = $1,
          slug = $2,
          is_active = $3,
          updated_at = now()
      WHERE id = $4
      `,
      [name, slug, is_active, id],
    );

    await client.query(
      `DELETE FROM shipping_provider_credentials WHERE provider_id = $1`,
      [id],
    );

    const encrypted: Record<string, string> = {};

    for (const [key, value] of Object.entries(credentials)) {
      encrypted[key] = encrypt(value);
    }

    // await client.query(
    //   `
    //   INSERT INTO shipping_provider_credentials (provider_id, metadata)
    //   VALUES ($1, $2)
    //   `,
    //   [id, encrypted],
    // );

    await client.query(
      `
      INSERT INTO shipping_provider_configs (provider_id, store_id, extra, is_active, updated_at)
      VALUES ($1, NULL, $2, $3, now())
      ON CONFLICT (provider_id, store_id) 
      DO UPDATE SET extra = EXCLUDED.extra, is_active = EXCLUDED.is_active, updated_at = now()
      `,
      [id, 
        // encrypted,
        credentials,
        is_active],
    );

    await client.query("COMMIT");

    return NextResponse.json({ success: true });
  } catch (err) {
    await client.query("ROLLBACK");

    console.error(err);

    const message =
      isPgError(err) && err.message ? err.message : "Failed to update provider";

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  } finally {
    client.release();
  }
}

// 🔥 replace all credentials (simple + safe approach)
// if (credentials && typeof credentials === "object") {
//   // delete old
//   await client.query(
//     `
//     DELETE FROM shipping_provider_credentials
//     WHERE provider_id = $1
//     `,
//     [id],
//   );

//   // insert new
//   for (const [key, value] of Object.entries(credentials)) {

//      await client.query(
//       `
//       INSERT INTO shipping_provider_credentials
//         (provider_id, api_key, api_secret)
//       VALUES ($1, $2, $3)
//       `,
//       [id, key, encrypt(String(value))],
//     );
//   }
// }
