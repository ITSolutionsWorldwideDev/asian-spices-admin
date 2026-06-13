// apps/admin/lib/shipping/resolveCredentials.ts
import { pool } from "@/core/db";
import { decrypt } from "@/lib/crypto";

export async function resolveProviderCredentials(
  providerId: string,
  storeId?: string,
) {
  const [platformRes, storeRes] = await Promise.all([
    pool.query(
      // `SELECT metadata FROM shipping_provider_credentials WHERE provider_id=$1`,
      `SELECT extra 
       FROM shipping_provider_configs 
       WHERE provider_id=$1  AND is_active = true
       ORDER BY updated_at DESC
       LIMIT 1`,
      [providerId],
    ),
    storeId
      ? pool.query(
          `SELECT credentials 
           FROM store_shipping_providers 
           WHERE provider_id=$1 AND store_id=$2 AND is_enabled = true`,
          [providerId, storeId],
        )
      : Promise.resolve({ rows: [] }),
  ]);

  return {
    ...platformRes.rows[0]?.extra,
    ...storeRes.rows[0]?.credentials,
  };

  const decryptObject = (obj: any) => {
    if (!obj || typeof obj !== "object") return {};

    const result: Record<string, string> = {};

    for (const key of Object.keys(obj)) {
      result[key] = decrypt(obj[key]);
    }

    return result;
  };

  return {
    ...decryptObject(platformRes.rows[0]?.extra),
    ...decryptObject(storeRes.rows[0]?.credentials),
  };
}
