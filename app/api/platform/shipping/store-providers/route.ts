// apps/admin/app/api/platform/shipping/store-providers/route.ts

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/core/db";
import { encrypt } from "@/lib/crypto";
import { normalizeCredentials } from "@/lib/utils/normalizeCredentials";
import { requirePlatformAdmin } from "@/lib/auth/guards";
import { validateProviderCredentials } from "@/lib/validations/validateProviderCredentials";
import { PROVIDER_CONFIGS } from "@/lib/shipping/providerConfigs";

export async function POST(req: NextRequest) {
  try {
    await requirePlatformAdmin();

    const body = await req.json();

    const { storeId, providerId, is_enabled } = body;

    if (!storeId || !providerId) {
      return NextResponse.json(
        { success: false, error: "Missing storeId or providerId" },
        { status: 400 }
      );
    }

    // ✅ normalize credentials
    const credentials = normalizeCredentials(body.credentials);

    // -----------------------------
    // 🔍 Get provider slug
    // -----------------------------
    const providerRes = await pool.query(
      `SELECT slug FROM shipping_providers WHERE id = $1`,
      [providerId]
    );

    const provider = providerRes.rows[0];

    if (!provider) {
      return NextResponse.json(
        { success: false, error: "Provider not found" },
        { status: 404 }
      );
    }

    const config = PROVIDER_CONFIGS[provider.slug];

    // -----------------------------
    // ✅ CONDITIONAL VALIDATION
    // -----------------------------
    const hasAnyCredential =
      credentials && Object.keys(credentials).length > 0;

    if (hasAnyCredential && config) {
      // 🔴 Only validate if user is trying to override
      validateProviderCredentials(provider.slug, credentials);
    }

    // -----------------------------
    // 🔐 Encrypt credentials
    // -----------------------------
    let encryptedCredentials = null;

    if (hasAnyCredential) {
      const encrypted: Record<string, string> = {};

      for (const [key, value] of Object.entries(credentials)) {
        encrypted[key] = encrypt(value);
      }

      encryptedCredentials = encrypted;
    }

    // -----------------------------
    // 🧠 Merge existing credentials (prevent overwrite loss)
    // -----------------------------
    const existing = await pool.query(
      `
      SELECT credentials
      FROM store_shipping_providers
      WHERE store_id = $1 AND provider_id = $2
      `,
      [storeId, providerId]
    );

    let finalCredentials = existing.rows[0]?.credentials || null;

    if (encryptedCredentials) {
      finalCredentials = {
        ...(finalCredentials || {}),
        ...encryptedCredentials,
      };
    }

    // -----------------------------
    // UPSERT
    // -----------------------------
    const result = await pool.query(
      `
      INSERT INTO store_shipping_providers 
        (store_id, provider_id, is_enabled, credentials)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (store_id, provider_id)
      DO UPDATE SET
        is_enabled = EXCLUDED.is_enabled,
        credentials = $4,
        updated_at = NOW()
      RETURNING *
      `,
      [storeId, providerId, is_enabled, finalCredentials]
    );

    return NextResponse.json({
      success: true,
      assignment: result.rows[0],
    });
  } catch (err: any) {
    console.error("store-providers error:", err);

    return NextResponse.json(
      { success: false, error: err?.message || "Server error" },
      { status: 500 }
    );
  }
}

/* import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/core/db";
import { encrypt } from "@/lib/crypto";

export async function POST(req: NextRequest) {
  try {
    const {
      storeId,
      providerId,
      is_enabled,
      credentials,
    } = await req.json();

    if (!storeId || !providerId) {
      return NextResponse.json(
        { success: false, error: "Missing storeId or providerId" },
        { status: 400 }
      );
    }

    // -----------------------------
    // Normalize credentials safely
    // -----------------------------
    let encryptedCredentials = null;

    if (credentials && typeof credentials === "object") {
      const encryptedObject: Record<string, string> = {};

      for (const [key, value] of Object.entries(credentials)) {
        if (value !== undefined && value !== null) {
          encryptedObject[key] = encrypt(String(value));
        }
      }

      encryptedCredentials = encryptedObject;
    }

    // -----------------------------
    // UPSERT assignment
    // -----------------------------
    const result = await pool.query(
      `
      INSERT INTO store_shipping_providers 
        (store_id, provider_id, is_enabled, credentials)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (store_id, provider_id)
      DO UPDATE SET
        is_enabled = EXCLUDED.is_enabled,
        credentials = EXCLUDED.credentials,
        updated_at = NOW()
      RETURNING *
      `,
      [storeId, providerId, is_enabled, encryptedCredentials]
    );

    return NextResponse.json({
      success: true,
      assignment: result.rows[0],
    });
  } catch (err) {
    console.error("store-providers error:", err);

    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
} */

/* import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/core/db";
import { encrypt } from "@/lib/crypto";

export async function POST(req: NextRequest) {
  try {
    const { storeId, providerId, is_enabled, apiKey, apiSecret } =
      await req.json();

    if (!storeId || !providerId) {
      return NextResponse.json(
        { success: false, error: "Missing fields" },
        { status: 400 },
      );
    }

    const encrypted =
      apiKey && apiSecret
        ? encrypt(JSON.stringify({ apiKey, apiSecret }))
        : null;

    const result = await pool.query(
      `
      INSERT INTO store_shipping_providers 
      (store_id, provider_id, is_enabled, credentials)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (store_id, provider_id)
      DO UPDATE SET
        is_enabled = EXCLUDED.is_enabled,
        credentials = COALESCE(EXCLUDED.credentials, store_shipping_providers.credentials),
        updated_at = NOW()
      RETURNING *
      `,
      [storeId, providerId, is_enabled, encrypted],
    );

    return NextResponse.json({
      success: true,
      assignment: result.rows[0],
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 },
    );
  }
} */