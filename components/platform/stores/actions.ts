// components/platform/stores/actions.ts

"use server";

import { pool } from "@/core/db";
import { requirePlatformAdmin } from "@/lib/auth/guards";
import { revalidatePath } from "next/cache";
import { logAudit } from "@/lib/audit";
import { redirect } from "next/navigation";
import { hash } from "bcryptjs";
import { generateUniqueApplicationId } from "@/lib/services/applicationId";
import { allocateUniqueStoreSlug } from "@/lib/services/store-slug";
import { sendPartnerRegistrationEmail } from "@/core/email-templates";
import { syncUserRoleColumn } from "@/lib/users/syncUserRole";

export async function updateStore(
  storeId: string | undefined,
  data: { name: string; status: string },
) {
  const user = await requirePlatformAdmin();

  await pool.query(
    `
    UPDATE stores
    SET name = $1, status = $2
    WHERE id = $3
    `,
    [data.name, data.status, storeId],
  );

  await logAudit({
    actorId: user.id,
    action: "store.update",
    entity: "store",
    entityId: storeId,
    metadata: data,
  });

  revalidatePath("/platform/stores");
  revalidatePath(`/platform/stores/${storeId}`);
}

export async function deleteStore(storeId: string) {
  const user = await requirePlatformAdmin();

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Clear child rows first (FK: store_users_store_id_fkey and related)
    await client.query(`DELETE FROM store_users WHERE store_id = $1`, [storeId]);
    await client.query(`DELETE FROM store_settings WHERE store_id = $1`, [storeId]);
    await client.query(`DELETE FROM store_addresses WHERE store_id = $1`, [storeId]);
    await client.query(
      `DELETE FROM store_payment_settings WHERE store_id = $1`,
      [storeId],
    );
    await client.query(
      `DELETE FROM store_shipping_settings WHERE store_id = $1`,
      [storeId],
    );
    await client.query(`DELETE FROM store_tax_settings WHERE store_id = $1`, [
      storeId,
    ]);
    await client.query(`DELETE FROM subscriptions WHERE store_id = $1`, [
      storeId,
    ]);

    await client.query(`DELETE FROM stores WHERE id = $1`, [storeId]);

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }

  await logAudit({
    actorId: user.id,
    action: "store.delete",
    entity: "store",
    entityId: storeId,
  });

  revalidatePath("/platform/stores");
}

export async function createStore(formData: FormData) {
  const platformUser = await requirePlatformAdmin();

  const name = formData.get("name") as string;
  const slug = formData.get("slug") as string;

  const adminName = formData.get("adminName") as string;
  const adminEmail = formData.get("adminEmail") as string;
  const adminPassword = formData.get("adminPassword") as string;

  if (!name || !slug || !adminEmail || !adminPassword) {
    throw new Error("Missing required fields");
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1️⃣ Create Store
    const storeRes = await client.query(
      `INSERT INTO stores (name, slug, status)
       VALUES ($1, $2, 'active')
       RETURNING id`,
      [name, slug],
    );

    const storeId = storeRes.rows[0].id;

    await client.query(
      `INSERT INTO store_settings (store_id, store_email, country_code)
       VALUES ($1, $2, $3)
       ON CONFLICT (store_id) DO UPDATE 
       SET store_email = EXCLUDED.store_email,
           updated_at = NOW()`,
      [storeId, adminEmail, 'NL'], // Defaulting country code to NL or extract dynamically
    );

    // 2️⃣ Reuse existing user by email, or create a new one
    const existingUser = await client.query(
      `SELECT id FROM users WHERE lower(email) = lower($1)`,
      [adminEmail],
    );

    let userId: string;
    if (existingUser.rows.length > 0) {
      userId = existingUser.rows[0].id;
    } else {
      const passwordHash = await hash(adminPassword, 10);
      const userRes = await client.query(
        `INSERT INTO users (email, password_hash, name)
         VALUES ($1, $2, $3)
         RETURNING id`,
        [adminEmail, passwordHash, adminName],
      );
      userId = userRes.rows[0].id;
    }

    // 3️⃣ Get Store Admin Role
    const roleRes = await client.query(
      `SELECT id FROM roles WHERE key = 'admin' AND scope = 'store'`,
    );

    const roleId = roleRes.rows[0].id;

    // 4️⃣ Assign User to Store
    await client.query(
      `INSERT INTO store_users (store_id, user_id, role_id)
       VALUES ($1, $2, $3)`,
      [storeId, userId, roleId],
    );

    await syncUserRoleColumn(client, userId);

    await client.query("COMMIT");

    revalidatePath("/platform/stores");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
export async function setStoreStatus(
  storeId: string,
  status: "active" | "suspended",
) {
  const user = await requirePlatformAdmin();

  await pool.query(`UPDATE stores SET status = $1 WHERE id = $2`, [
    status,
    storeId,
  ]);

  await logAudit({
    actorId: user.id,
    action: `store.${status}`,
    entity: "store",
    entityId: storeId,
  });

  revalidatePath("/platform/stores");
  //   revalidatePath(`/stores/${storeId}`);
}

export async function saveStore(
  storeId: string | undefined,
  formData: FormData,
) {
  await requirePlatformAdmin();

  // console.log("saveStore formData ==== ", formData);

  const data = Object.fromEntries(formData.entries());
  const {
    name,
    status,
    adminName,
    adminEmail,
    adminPassword,
    // kvkNumber, // KVK capture disabled for store registration
    companyName,
    chamberOfCommerceNumber,
    country,
    street,
    houseNumber,
    addition,
    postalCode,
    city,
    firstName,
    middleName,
    lastName,
    businessPhone,
    businessEmail,
    vatNumber,
    chamberExtractDocuments: chamberExtractRaw,
    powerOfAttorneyDocument,
  } = data;

  let slug = String(data.slug || "");

  if (!name || !slug) {
    throw new Error("Missing required fields");
  }

  // KVK capture disabled — always store null
  const kvkNumber = null;

  let chamberExtractDocuments: string[] | null = null;
  if (chamberExtractRaw) {
    try {
      const parsed = JSON.parse(String(chamberExtractRaw));
      if (Array.isArray(parsed) && parsed.length > 0) {
        chamberExtractDocuments = parsed.map(String);
      }
    } catch {
      chamberExtractDocuments = null;
    }
  }
  const poaDocument = powerOfAttorneyDocument
    ? String(powerOfAttorneyDocument)
    : null;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Block if this business email already exists on any partner registration
    // (when editing, allow the partner already linked to this store).
    if (businessEmail) {
      const existingBizEmail = await client.query(
        `SELECT pr.partner_id
         FROM partner_registration pr
         WHERE lower(pr.business_email_address) = lower($1)
           AND NOT EXISTS (
             SELECT 1 FROM stores s
             WHERE $2::uuid IS NOT NULL
               AND s.id = $2::uuid
               AND (
                 s.partner_registration_id = pr.partner_id::text
                 OR s.partner_registration_id = pr.application_id
               )
           )
         LIMIT 1`,
        [businessEmail, storeId ?? null],
      );

      if (existingBizEmail.rows.length > 0) {
        throw new Error(
          "This business email already exists. Please use a different email.",
        );
      }
    }

    // Block duplicate Chamber of Commerce / VAT numbers (same exclusion as email)
    const excludeOwnPartnerSql = `
      AND NOT EXISTS (
        SELECT 1 FROM stores s
        WHERE $2::uuid IS NOT NULL
          AND s.id = $2::uuid
          AND (
            s.partner_registration_id = pr.partner_id::text
            OR s.partner_registration_id = pr.application_id
          )
      )
    `;

    const coc = String(chamberOfCommerceNumber || "").trim();
    if (coc) {
      const existingCoc = await client.query(
        `SELECT pr.partner_id
         FROM partner_registration pr
         WHERE lower(trim(pr.chamber_of_commerce_number)) = lower($1)
           ${excludeOwnPartnerSql}
         LIMIT 1`,
        [coc, storeId ?? null],
      );
      if (existingCoc.rows.length > 0) {
        throw new Error(
          "This Chamber of Commerce number already exists. Please use a different number.",
        );
      }
    }

    const vat = String(vatNumber || "").trim();
    if (vat) {
      const existingVat = await client.query(
        `SELECT pr.partner_id
         FROM partner_registration pr
         WHERE lower(trim(pr.vat_number)) = lower($1)
           ${excludeOwnPartnerSql}
         LIMIT 1`,
        [vat, storeId ?? null],
      );
      if (existingVat.rows.length > 0) {
        throw new Error(
          "This VAT number already exists. Please use a different number.",
        );
      }
    }

    let finalStoreId = storeId;
    let partnerRegId: string | null = null;
    let createdApplicationId: string | null = null;

    // stores.slug is unique. On create, pick the next free slug so a repeated
    // store name does not fail with stores_slug_key. On edit, keep the chosen
    // slug and reject it when another store already owns it.
    if (storeId) {
      const taken = await client.query(
        `SELECT 1 FROM stores WHERE slug = $1 AND id <> $2::uuid LIMIT 1`,
        [slug, storeId],
      );
      if (taken.rows.length > 0) {
        throw new Error(
          `The store slug "${slug}" is already used by another store. Choose a different slug.`,
        );
      }
    } else {
      slug = await allocateUniqueStoreSlug(client, slug);
    }

    // 1️⃣ CREATE OR UPDATE STORE
    if (storeId) {
      // 1️⃣ Update store basic info
      const storeRes = await client.query(
        `UPDATE stores 
         SET name = $1, slug = $2, status = $3
         WHERE id = $4
         RETURNING partner_registration_id`,
        [name, slug, status, storeId],
      );

      partnerRegId = storeRes.rows[0]?.partner_registration_id;

      // 2️⃣ UPSERT partner_registration
      if (partnerRegId) {
        // ✅ UPDATE existing.
        // stores.partner_registration_id can hold either partner_id (UUID, from
        // the admin add-store path) or application_id (varchar, from the
        // self-service approval path), so match on both. Also give the row an
        // application_id if it somehow still lacks one (ticket 68).
        const editApplicationId = await generateUniqueApplicationId(client);
        await client.query(
          `
          UPDATE partner_registration SET
            kvk_number = $1,
            company_name = $2,
            chamber_of_commerce_number = $3,
            country = $4,
            street = $5,
            house_number = $6,
            additional_address = $7,
            postal_code = $8,
            city = $9,
            first_name = $10,
            middle_name = $11,
            last_name = $12,
            business_phone_number = $13,
            business_email_address = $14,
            vat_number = $15,
            application_id = COALESCE(application_id, $17),
            chamber_of_commerce_extract_document = COALESCE($18, chamber_of_commerce_extract_document),
            power_of_attorney_document = COALESCE($19, power_of_attorney_document)
          WHERE partner_id::text = $16 OR application_id = $16
          `,
          [
            kvkNumber,
            companyName,
            chamberOfCommerceNumber,
            country,
            street,
            houseNumber,
            addition,
            postalCode,
            city,
            firstName,
            middleName,
            lastName,
            businessPhone,
            businessEmail,
            vatNumber,
            partnerRegId,
            editApplicationId,
            chamberExtractDocuments,
            poaDocument,
          ],
        );
      } else {
        // ✅ INSERT new (edge case)
        const applicationId = await generateUniqueApplicationId(client);
        const partnerRes = await client.query(
          `
          INSERT INTO partner_registration (
            application_id,
            kvk_number,
            company_name,
            chamber_of_commerce_number,
            country,
            street,
            house_number,
            additional_address,
            postal_code,
            city,
            first_name,
            middle_name,
            last_name,
            business_phone_number,
            business_email_address,
            vat_number,
            chamber_of_commerce_extract_document,
            power_of_attorney_document
          )
          VALUES (
            $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
            $11,$12,$13,$14,$15,$16,$17,$18
          )
          RETURNING partner_id
          `,
          [
            applicationId,
            kvkNumber,
            companyName,
            chamberOfCommerceNumber,
            country,
            street,
            houseNumber,
            addition,
            postalCode,
            city,
            firstName,
            middleName,
            lastName,
            businessPhone,
            businessEmail,
            vatNumber,
            chamberExtractDocuments,
            poaDocument,
          ],
        );

        partnerRegId = partnerRes.rows[0].partner_id;

        await client.query(
          `UPDATE stores 
           SET partner_registration_id = $1
           WHERE id = $2`,
          [partnerRegId, storeId],
        );
      }
    } else {
      const applicationId = await generateUniqueApplicationId(client);
      createdApplicationId = applicationId;
      const partnerRegData = await client.query(
        `INSERT INTO partner_registration (
        application_id,
        kvk_number,
        company_name,
        chamber_of_commerce_number,
        country,
        street,
        house_number,
        additional_address,
        postal_code,
        city,
        first_name,
        middle_name,
        last_name,
        business_phone_number,
        business_email_address,
        vat_number,
        chamber_of_commerce_extract_document,
        power_of_attorney_document
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
        $11,$12,$13,$14,$15,$16,$17,$18
      )
      RETURNING partner_id`,
        [
          applicationId,
          kvkNumber,
          companyName,
          chamberOfCommerceNumber,
          country,
          street,
          houseNumber,
          addition,
          postalCode,
          city,
          firstName,
          middleName,
          lastName,
          businessPhone,
          businessEmail,
          vatNumber,
          chamberExtractDocuments,
          poaDocument,
        ],
      );

      const partnerRegId = partnerRegData.rows[0].partner_id;

      const storeRes = await client.query(
        `INSERT INTO stores (name, slug, status,partner_registration_id)
         VALUES ($1, $2, $3,$4)
         RETURNING id`,
        [name, slug, "pending", partnerRegId],
      );

      finalStoreId = storeRes.rows[0].id;

      // 2️⃣ Reuse existing admin user by email, or create a new one
      if (!adminEmail) {
        throw new Error("Admin email required");
      }

      const existingUser = await client.query(
        `SELECT id FROM users WHERE lower(email) = lower($1)`,
        [adminEmail],
      );

      let userId: string;
      if (existingUser.rows.length > 0) {
        userId = existingUser.rows[0].id;
      } else {
        if (!adminPassword) {
          throw new Error("Password required for new user");
        }

        const passwordHash = await hash(adminPassword as string, 10);
        const newUser = await client.query(
          `INSERT INTO users (email, password_hash, name)
           VALUES ($1, $2, $3)
           RETURNING id`,
          [adminEmail, passwordHash, adminName],
        );
        userId = newUser.rows[0].id;
      }

      // Assign admin role
      const roleRes = await client.query(
        `SELECT id FROM roles WHERE key = 'admin' AND scope = 'store'`,
      );

      await client.query(
        `INSERT INTO store_users (store_id, user_id, role_id)
         VALUES ($1, $2, $3)
         ON CONFLICT (store_id, user_id) DO NOTHING`,
        [finalStoreId, userId, roleRes.rows[0].id],
      );

      await syncUserRoleColumn(client, userId);
    }

    if (finalStoreId) {
      await client.query(
        `
        INSERT INTO store_settings (
          store_id, 
          store_email, 
          store_phone, 
          country_code,
          updated_at
        )
        VALUES ($1, $2, $3, $4, NOW())
        ON CONFLICT (store_id) DO UPDATE SET
          store_email = EXCLUDED.store_email,
          store_phone = EXCLUDED.store_phone,
          country_code = EXCLUDED.country_code,
          updated_at = NOW()
        `,
        [
          finalStoreId,
          businessEmail || null,
          businessPhone || null,
          country || null
        ]
      );
    }

    await client.query("COMMIT");

    // Same Partner Application Received template as the web registration flow
    if (!storeId && adminEmail && createdApplicationId) {
      await sendPartnerRegistrationEmail({
        email: String(adminEmail),
        companyName: String(companyName || name),
        firstName: String(firstName || adminName || "Partner"),
        applicationId: createdApplicationId,
      });
    }

    revalidatePath("/platform/stores");
    revalidatePath(`/platform/stores/${finalStoreId}`);

    return {
      success: true,
      storeId: finalStoreId,
      slug,
      message: storeId ? "Store updated" : "Store created",
    };
  } catch (err: any) {
    await client.query("ROLLBACK");
    const constraint = err?.constraint as string | undefined;
    const error =
      err?.code === "23505" && constraint === "stores_slug_key"
        ? "A store with this slug already exists. Change the store name or slug and try again."
        : err.message || "Failed to save store";
    return {
      success: false,
      error,
    };
  } finally {
    client.release();
  }

  // redirect("/platform/stores");
}

/* export async function createStore(formData: FormData) {
  const user = await requirePlatformAdmin();

  const name = formData.get("name") as string;
  const slug = formData.get("slug") as string;
  const ownerUserId = formData.get("ownerUserId") as string;

  if (!name || !slug || !ownerUserId) {
    throw new Error("Missing required fields");
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { rows } = await client.query(
      `
      INSERT INTO stores (name, slug, status)
      VALUES ($1, $2, 'active')
      RETURNING id
      `,
      [name, slug],
    );

    const storeId = rows[0].id;

    const roleRes = await client.query(
      `SELECT id FROM roles WHERE key = 'admin' AND scope = 'store'`,
    );

    await client.query(
      `
      INSERT INTO store_users (store_id, user_id, role_id)
      VALUES ($1, $2, $3)
      `,
      [storeId, ownerUserId, roleRes.rows[0].id],
    );

    await syncUserRoleColumn(client, ownerUserId);

    await logAudit({
      actorId: user.id,
      action: "store.create",
      entity: "store",
      entityId: storeId,
      metadata: { name, slug },
    });

    await client.query("COMMIT");

    revalidatePath("/platform/stores");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
} */

/* export async function saveStore(
  storeId: string | undefined,
  formData: FormData,
) {
  await requirePlatformAdmin();

  const data = {
    name: formData.get("name"),
    slug: formData.get("slug"),
    status: formData.get("status"),
  };

  if (storeId) {
    await pool.query(
      `
      UPDATE stores
      SET name = $1, slug = $2, status = $3
      WHERE id = $4
      `,
      [data.name, data.slug, data.status, storeId],
    );
  } else {
    await pool.query(
      `
      INSERT INTO stores (name, slug, status)
      VALUES ($1, $2, $3)
      `,
      [data.name, data.slug, data.status],
    );
  }

  revalidatePath("/platform/stores");
  redirect("/platform/stores");
} */

// await client.query(
//   `
//   INSERT INTO subscriptions (store_id, plan_id, status)
//   VALUES ($1, $2, 'active')
//   `,
//   [storeId, defaultPlanId],
// );
