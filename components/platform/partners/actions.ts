// components/platform/partners/actions.ts

"use server";

import { pool } from "@/core/db";
import { requirePlatformAdmin } from "@/lib/auth/guards";
import { revalidatePath } from "next/cache";
import { logAudit } from "@/lib/audit";
import { createStoreFromPartner } from "@/lib/services/partner.service";
import {
  sendPartnerRegistrationEmail,
  sendPartnerApprovalEmail,
  sendPartnerRejectionEmail,
} from "@/core/email-templates";
import { sendEmail } from "@/core/email";
import { generateUniqueApplicationId } from "@/lib/services/applicationId";
import { redirect } from "next/navigation";
import { hash } from "bcryptjs";
import { randomUUID } from "crypto";
import { assertEmailNotPrivileged } from "@/lib/users/assertEmailAvailable";
import { syncUserRoleColumn } from "@/lib/users/syncUserRole";

/** Create partner registration only — store is created on approve. */
export async function createPartner(formData: FormData) {
  const user = await requirePlatformAdmin();
  const data = Object.fromEntries(formData.entries());

  const {
    name,
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
    adminEmail,
    adminName,
    adminPassword,
  } = data;

  const resolvedCompanyName = String(companyName || name || "").trim();
  if (!resolvedCompanyName) {
    return { success: false, error: "Company / store name is required" };
  }
  if (!businessEmail) {
    return { success: false, error: "Business email is required" };
  }

  const initialAdminEmail = String(adminEmail || "").trim();
  const initialAdminName = String(adminName || "").trim();
  const initialAdminPassword = String(adminPassword || "");
  const hasInitialAdmin =
    Boolean(initialAdminEmail) &&
    Boolean(initialAdminName) &&
    Boolean(initialAdminPassword);

  // All three Initial Admin fields are required together (or leave all empty)
  if (
    (initialAdminEmail || initialAdminName || initialAdminPassword) &&
    !hasInitialAdmin
  ) {
    return {
      success: false,
      error:
        "To create an Initial Admin Account, fill Admin Name, Email, and Password.",
    };
  }

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
  let applicationId = "";

  try {
    await client.query("BEGIN");

    await assertEmailNotPrivileged(
      client,
      String(businessEmail),
      "business email",
    );
    if (hasInitialAdmin) {
      await assertEmailNotPrivileged(
        client,
        initialAdminEmail,
        "admin email",
      );
    }

    const existingBizEmail = await client.query(
      `SELECT partner_id FROM partner_registration
       WHERE lower(business_email_address) = lower($1)
       LIMIT 1`,
      [businessEmail],
    );
    if (existingBizEmail.rows.length > 0) {
      throw new Error(
        "This business email already exists. Please use a different email.",
      );
    }

    const coc = String(chamberOfCommerceNumber || "").trim();
    if (coc) {
      const existingCoc = await client.query(
        `SELECT partner_id FROM partner_registration
         WHERE lower(trim(chamber_of_commerce_number)) = lower($1)
         LIMIT 1`,
        [coc],
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
        `SELECT partner_id FROM partner_registration
         WHERE lower(trim(vat_number)) = lower($1)
         LIMIT 1`,
        [vat],
      );
      if (existingVat.rows.length > 0) {
        throw new Error(
          "This VAT number already exists. Please use a different number.",
        );
      }
    }

    applicationId = await generateUniqueApplicationId(client);

    const { rows } = await client.query(
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
        power_of_attorney_document,
        status
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
        $11,$12,$13,$14,$15,$16,$17,$18,'pending'
      )
      RETURNING partner_id`,
      [
        applicationId,
        null,
        resolvedCompanyName,
        chamberOfCommerceNumber || null,
        country || null,
        street || null,
        houseNumber || null,
        addition || null,
        postalCode || null,
        city || null,
        firstName || null,
        middleName || null,
        lastName || null,
        businessPhone || null,
        businessEmail,
        vatNumber || null,
        chamberExtractDocuments,
        poaDocument,
      ],
    );

    const partnerId = rows[0].partner_id;

    // Optional Initial Admin Account:
    // - Admin user (role admin) with Initial Admin email/password
    // - Store owner user (role store_owner) with business email + random password
    // Both get store_users roles on approve. Credentials emailed to business email on approve.
    let createdAdminPassword: string | undefined;
    let createdOwnerPassword: string | undefined;
    if (hasInitialAdmin) {
      // Reuse existing non-privileged users (assertEmailNotPrivileged already
      // blocked platform admins / store staff). Create only when missing.
      const adminPasswordHash = await hash(initialAdminPassword, 10);
      const existingAdmin = await client.query(
        `SELECT id FROM users WHERE lower(email) = lower($1) LIMIT 1`,
        [initialAdminEmail],
      );
      if (existingAdmin.rows.length > 0) {
        await client.query(
          `UPDATE users
           SET password_hash = $1,
               name = $2,
               status = 'active',
               role = 'admin'
           WHERE id = $3`,
          [adminPasswordHash, initialAdminName, existingAdmin.rows[0].id],
        );
      } else {
        await client.query(
          `INSERT INTO users (email, password_hash, name, status, role)
           VALUES ($1, $2, $3, 'active', 'admin')`,
          [initialAdminEmail, adminPasswordHash, initialAdminName],
        );
      }
      createdAdminPassword = initialAdminPassword;

      const ownerEmail = String(businessEmail).trim();
      const sameEmail =
        initialAdminEmail.toLowerCase() === ownerEmail.toLowerCase();

      // Same address is one account: keep the form admin password and do not
      // issue a second, random store-owner password.
      if (!sameEmail) {
        createdOwnerPassword = Math.random().toString(36).slice(-10);
        const ownerPasswordHash = await hash(createdOwnerPassword, 10);
        const ownerName =
          `${String(firstName || "").trim()} ${String(lastName || "").trim()}`.trim() ||
          resolvedCompanyName ||
          "Store Owner";
        const existingOwner = await client.query(
          `SELECT id FROM users WHERE lower(email) = lower($1) LIMIT 1`,
          [ownerEmail],
        );
        if (existingOwner.rows.length > 0) {
          await client.query(
            `UPDATE users
             SET password_hash = $1,
                 name = $2,
                 status = 'active',
                 role = 'store_owner'
             WHERE id = $3`,
            [ownerPasswordHash, ownerName, existingOwner.rows[0].id],
          );
        } else {
          await client.query(
            `INSERT INTO users (email, password_hash, name, status, role)
             VALUES ($1, $2, $3, 'active', 'store_owner')`,
            [ownerEmail, ownerPasswordHash, ownerName],
          );
        }
      }
    }

    await logAudit({
      actorId: user.id,
      action: "partner.created",
      entity: "partner",
      entityId: partnerId,
      metadata: {
        applicationId,
        initialAdminCreated: Boolean(createdAdminPassword),
        // Kept only until approve so credentials can be emailed then (not at create)
        ...(createdAdminPassword
          ? {
              initialAdminPassword: createdAdminPassword,
              initialAdminEmail: initialAdminEmail,
              ...(createdOwnerPassword
                ? { storeOwnerPassword: createdOwnerPassword }
                : {}),
            }
          : {}),
      },
    });

    await client.query("COMMIT");

    await sendPartnerRegistrationEmail({
      email: String(businessEmail),
      companyName: resolvedCompanyName,
      firstName: String(firstName || "Partner"),
      applicationId,
    });

    revalidatePath("/platform/partners");

    return { success: true, partnerId, applicationId };
  } catch (err: any) {
    await client.query("ROLLBACK");
    return {
      success: false,
      error: err.message || "Failed to create partner",
    };
  } finally {
    client.release();
  }
}

export async function approvePartner(partnerId: string) {
  const user = await requirePlatformAdmin();
  const client = await pool.connect();

  let partnerEmail = "";
  let partnerFirstName = "";
  let partnerCompanyName = "";
  let partnerApplicationId = "";
  let emailPayload: {
    storeId: string;
    userId: string;
    tempPassword?: string;
    usedExistingCredentials?: boolean;
    loginEmail?: string;
    adminLoginEmail?: string;
    adminPassword?: string;
  } | null = null;

  try {
    await client.query("BEGIN");

    // FOR UPDATE explicitly blocks simultaneous admin adjustments
    const { rows } = await client.query(
      `SELECT * FROM partner_registration WHERE partner_id = $1 FOR UPDATE`,
      [partnerId],
    );

    const partner = rows[0];
    if (!partner) throw new Error("Partner application record not found.");
    if (partner.status !== "pending") {
      throw new Error(
        `Cannot approve application with current status: ${partner.status}`,
      );
    }

    partnerEmail = partner.business_email_address;
    partnerFirstName = partner.first_name;
    partnerCompanyName = partner.company_name;
    partnerApplicationId = partner.application_id || "";

    // Recover Initial Admin + store-owner passwords saved at create (if any)
    const auditRes = await client.query(
      `SELECT id, metadata FROM audit_logs
       WHERE entity = 'partner' AND entity_id = $1 AND action = 'partner.created'
       ORDER BY created_at DESC
       LIMIT 1`,
      [partnerId],
    );
    const createMeta = auditRes.rows[0]?.metadata || {};
    const initialAdminEmail = createMeta.initialAdminEmail
      ? String(createMeta.initialAdminEmail)
      : "";
    const savedInitialPassword = createMeta.initialAdminPassword
      ? String(createMeta.initialAdminPassword)
      : "";
    const savedOwnerPassword = createMeta.storeOwnerPassword
      ? String(createMeta.storeOwnerPassword)
      : "";
    const hasInitialAdminAccounts = Boolean(initialAdminEmail);

    // Store owner always uses business email. Initial Admin (if any) is a separate admin user.
    const storeOwnerLogin = partnerEmail;
    const sameLoginEmail =
      Boolean(initialAdminEmail) &&
      initialAdminEmail.toLowerCase() ===
        String(storeOwnerLogin || "").trim().toLowerCase();

    // If a store was already created with this partner (pending), activate it.
    // Otherwise provision a new store (web registration flow).
    const existingStore = await client.query(
      `SELECT id FROM stores
       WHERE partner_registration_id = $1::text
          OR ($2::text IS NOT NULL AND partner_registration_id = $2)
       LIMIT 1`,
      [String(partner.partner_id), partner.application_id ?? null],
    );

    let result: {
      storeId: string;
      userId: string;
      tempPassword?: string;
      usedExistingCredentials?: boolean;
      loginEmail?: string;
      adminLoginEmail?: string;
      adminPassword?: string;
    };

    if (existingStore.rows.length > 0) {
      const storeId = existingStore.rows[0].id as string;
      await client.query(
        `UPDATE stores SET status = 'active' WHERE id = $1`,
        [storeId],
      );
      result = { storeId, userId: "", loginEmail: storeOwnerLogin };
    } else {
      result = await createStoreFromPartner(client, {
        ...partner,
        owner_login_email: storeOwnerLogin,
      });
      result = { ...result, loginEmail: storeOwnerLogin };
    }

    if (!partnerEmail) {
      throw new Error("Partner business email is missing; cannot send login credentials.");
    }

    const ownerRoleRes = await client.query(
      `SELECT id FROM roles WHERE key = 'store_owner' LIMIT 1`,
    );
    const adminRoleRes = await client.query(
      `SELECT id FROM roles WHERE key = 'admin' AND scope = 'store' LIMIT 1`,
    );

    // Ensure store-owner account (business email) is linked
    if (!result.tempPassword) {
      const ownerRes = await client.query(
        `SELECT id FROM users WHERE lower(email) = lower($1) LIMIT 1`,
        [storeOwnerLogin],
      );

      if (ownerRes.rows.length > 0) {
        const userId = ownerRes.rows[0].id as string;
        await client.query(
          `UPDATE users
           SET store_id = COALESCE(store_id, $1),
               role = 'store_owner'
           WHERE id = $2`,
          [result.storeId, userId],
        );

        if (ownerRoleRes.rows.length > 0) {
          await client.query(
            `INSERT INTO store_users (store_id, user_id, role_id)
             VALUES ($1, $2, $3)
             ON CONFLICT (store_id, user_id) DO UPDATE SET role_id = EXCLUDED.role_id`,
            [result.storeId, userId, ownerRoleRes.rows[0].id],
          );
        }
        await syncUserRoleColumn(client, userId);

        // Same email: the form admin password is already on this user. Do not
        // replace it with a random store-owner password.
        // Different emails: prefer the password saved at create, otherwise
        // issue a fresh temp password so the credentials email can be sent.
        let tempPassword: string | undefined;
        if (sameLoginEmail && savedInitialPassword) {
          tempPassword = savedInitialPassword;
          const passwordHash = await hash(tempPassword, 10);
          await client.query(
            `UPDATE users SET password_hash = $1 WHERE id = $2`,
            [passwordHash, userId],
          );
        } else {
          tempPassword = savedOwnerPassword || undefined;
          if (!tempPassword) {
            tempPassword = Math.random().toString(36).slice(-10);
            const passwordHash = await hash(tempPassword, 10);
            await client.query(
              `UPDATE users SET password_hash = $1 WHERE id = $2`,
              [passwordHash, userId],
            );
          }
        }

        result = {
          ...result,
          userId,
          usedExistingCredentials: hasInitialAdminAccounts,
          loginEmail: storeOwnerLogin,
          tempPassword,
        };
      } else if (sameLoginEmail && savedInitialPassword) {
        const tempPassword = savedInitialPassword;
        const passwordHash = await hash(tempPassword, 10);
        const ownerName =
          `${partner.first_name || ""} ${partner.last_name || ""}`.trim() ||
          partnerCompanyName ||
          "Partner";

        const userId = randomUUID();
        await client.query(
          `INSERT INTO users (id, email, password_hash, name, store_id, role)
           VALUES ($1, $2, $3, $4, $5, 'admin')`,
          [userId, storeOwnerLogin, passwordHash, ownerName, result.storeId],
        );

        if (adminRoleRes.rows.length > 0) {
          await client.query(
            `INSERT INTO store_users (store_id, user_id, role_id)
             VALUES ($1, $2, $3)
             ON CONFLICT (store_id, user_id) DO UPDATE SET role_id = EXCLUDED.role_id`,
            [result.storeId, userId, adminRoleRes.rows[0].id],
          );
        }
        await syncUserRoleColumn(client, userId);

        result = {
          ...result,
          userId,
          tempPassword,
          loginEmail: storeOwnerLogin,
        };
      } else {
        const tempPassword = Math.random().toString(36).slice(-10);
        const passwordHash = await hash(tempPassword, 10);
        const ownerName =
          `${partner.first_name || ""} ${partner.last_name || ""}`.trim() ||
          partnerCompanyName ||
          "Partner";

        const userId = randomUUID();
        await client.query(
          `INSERT INTO users (id, email, password_hash, name, store_id, role)
           VALUES ($1, $2, $3, $4, $5, 'store_owner')`,
          [userId, storeOwnerLogin, passwordHash, ownerName, result.storeId],
        );

        if (ownerRoleRes.rows.length > 0) {
          await client.query(
            `INSERT INTO store_users (store_id, user_id, role_id)
             VALUES ($1, $2, $3)
             ON CONFLICT (store_id, user_id) DO UPDATE SET role_id = EXCLUDED.role_id`,
            [result.storeId, userId, ownerRoleRes.rows[0].id],
          );
        }
        await syncUserRoleColumn(client, userId);

        result = {
          ...result,
          userId,
          tempPassword,
          loginEmail: storeOwnerLogin,
        };
      }
    } else {
      result = { ...result, loginEmail: storeOwnerLogin };
    }

    // Link Initial Admin as store "admin" (separate from store_owner)
    if (hasInitialAdminAccounts && initialAdminEmail) {
      const adminRes = await client.query(
        `SELECT id FROM users WHERE lower(email) = lower($1) LIMIT 1`,
        [initialAdminEmail],
      );
      if (adminRes.rows.length > 0) {
        const adminUserId = adminRes.rows[0].id as string;
        await client.query(
          `UPDATE users
           SET store_id = COALESCE(store_id, $1),
               role = 'admin'
           WHERE id = $2`,
          [result.storeId, adminUserId],
        );

        if (adminRoleRes.rows.length > 0) {
          await client.query(
            `INSERT INTO store_users (store_id, user_id, role_id)
             VALUES ($1, $2, $3)
             ON CONFLICT (store_id, user_id) DO UPDATE SET role_id = EXCLUDED.role_id`,
            [result.storeId, adminUserId, adminRoleRes.rows[0].id],
          );
        }
        await syncUserRoleColumn(client, adminUserId);

        result = {
          ...result,
          adminLoginEmail: initialAdminEmail,
          adminPassword: savedInitialPassword || undefined,
        };
      }

      if (auditRes.rows[0]?.id) {
        await client.query(
          `UPDATE audit_logs
           SET metadata = (
             metadata::jsonb
             - 'initialAdminPassword'
             - 'initialAdminEmail'
             - 'storeOwnerPassword'
           )
           WHERE id = $1`,
          [auditRes.rows[0].id],
        );
      }
    }

    await client.query(
      `UPDATE partner_registration
       SET status = 'approved',
           reviewed_by = $1,
           reviewed_at = NOW()
       WHERE partner_id = $2`,
      [user.id, partnerId],
    );

    await logAudit({
      actorId: user.id,
      action: "partner.approved",
      entity: "partner",
      entityId: partnerId,
      metadata: { storeId: result.storeId, userId: result.userId },
    });

    await client.query("COMMIT");

    // Capture details for post-commit notification processing
    emailPayload = result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }

  // Send login credentials after approval to business email.
  // - With Initial Admin: store_owner (business email) + admin (Initial Admin email)
  // - Without: store_owner only (business email + random password)
  let emailSent = false;
  if (partnerEmail && emailPayload?.tempPassword) {
    const mailResult = await sendPartnerApprovalEmail({
      email: partnerEmail,
      companyName: partnerCompanyName || "Your company",
      firstName: partnerFirstName || "Partner",
      applicationId: partnerApplicationId || undefined,
      tempPassword: emailPayload.tempPassword,
      loginEmail: emailPayload.loginEmail || partnerEmail,
      adminLoginEmail: emailPayload.adminLoginEmail,
      adminPassword: emailPayload.adminPassword,
    });
    emailSent = Boolean(mailResult.success);
    if (!mailResult.success) {
      console.error(
        "[approvePartner] Credentials email failed after successful approval",
        mailResult.error,
      );
    }
  } else {
    console.error(
      "[approvePartner] Skipped credentials email — missing tempPassword or partnerEmail",
      {
        partnerEmail,
        hasTempPassword: Boolean(emailPayload?.tempPassword),
        usedExistingCredentials: Boolean(emailPayload?.usedExistingCredentials),
      },
    );
  }

  revalidatePath("/platform/partners");
  revalidatePath(`/platform/partners/${partnerId}`);
  return {
    success: true,
    emailSent,
    email: partnerEmail,
    // Only exposed when the email could not be delivered, so the admin can share it manually
    tempPassword: emailSent ? undefined : emailPayload?.tempPassword,
  };
}

export async function rejectPartner(
  partnerId: string,
  reason: string = "Rejected",
) {
  const user = await requirePlatformAdmin();

  if (!reason || reason.trim().length < 5) {
    throw new Error(
      "A comprehensive rejection reason (at least 5 characters) is required.",
    );
  }

  const client = await pool.connect();
  let partnerEmail = "";
  let partnerFirstName = "";
  let partnerCompanyName = "";
  let partnerApplicationId = "";

  try {
    await client.query("BEGIN");

    // Fetch details inside the transaction before making structural adjustments
    const { rows } = await client.query(
      `SELECT first_name, business_email_address, company_name, application_id, status FROM partner_registration WHERE partner_id = $1 FOR UPDATE`,
      [partnerId],
    );

    const partner = rows[0];
    if (!partner) throw new Error("Partner application record not found.");
    if (partner.status !== "pending") {
      throw new Error(
        `Cannot process a non-pending application. Current status: ${partner.status}`,
      );
    }

    partnerEmail = partner.business_email_address;
    partnerFirstName = partner.first_name;
    partnerCompanyName = partner.company_name;
    partnerApplicationId = partner.application_id;

    await client.query(
      `UPDATE partner_registration
       SET status = 'rejected',
           rejection_reason = $1,
           reviewed_by = $2,
           reviewed_at = NOW()
       WHERE partner_id = $3`,
      [reason, user.id, partnerId],
    );

    await logAudit({
      actorId: user.id,
      action: "partner.rejected",
      entity: "partner",
      entityId: partnerId,
      metadata: { reason },
    });

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }

  // Handle rejection email dispatch cleanly after database rollback safety
  try {
    if (partnerEmail) {
      await sendPartnerRejectionEmail({
        email: partnerEmail,
        companyName: partnerCompanyName,
        firstName: partnerFirstName,
        applicationId: partnerApplicationId,
        reason,
      });
    }
  } catch (mailErr) {
    console.error(
      "Database updated but rejection email failed to dispatch:",
      mailErr,
    );
  }

  /* [OLD INLINE REJECTION EMAIL COMMENTED OUT]
  try {
    await sendEmail({
      to: partnerEmail,
      subject: "Update regarding your store application",
      html: `
        <p>Hello ${partnerFirstName},</p>
        <p>Thank you for your interest in our platform. After reviewing your application, we regret to inform you that we cannot approve your store at this time.</p>
        <p><b>Reason for rejection:</b> ${reason}</p>
        <p>If you believe this was an error or would like to re-apply after addressing the feedback above, please feel free to reach out to support.</p>
      `,
    });
  } catch (mailErr) {}
  */

  revalidatePath("/platform/partners");
  return { success: true };
}

export async function deletePartner(partnerId: string) {
  const user = await requirePlatformAdmin();

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { rows } = await client.query(
      `SELECT partner_id, application_id FROM partner_registration WHERE partner_id = $1`,
      [partnerId],
    );
    if (!rows[0]) throw new Error("Partner application record not found.");

    const { partner_id, application_id } = rows[0];

    // Unlink any store that still points at this registration
    await client.query(
      `UPDATE stores
       SET partner_registration_id = NULL
       WHERE partner_registration_id = $1
          OR ($2::text IS NOT NULL AND partner_registration_id = $2)`,
      [String(partner_id), application_id ?? null],
    );

    await client.query(
      `DELETE FROM partner_registration WHERE partner_id = $1`,
      [partnerId],
    );

    await logAudit({
      actorId: user.id,
      action: "partner.deleted",
      entity: "partner",
      entityId: partnerId,
    });

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }

  revalidatePath("/platform/partners");
  revalidatePath("/platform/stores");
  redirect("/platform/partners");
}

/* "use server";

import { pool } from "@/core/db";
import { requirePlatformAdmin } from "@/lib/auth/guards";
import { revalidatePath } from "next/cache";
import { logAudit } from "@/lib/audit";
import { createStoreFromPartner } from "@/lib/services/partner.service";

export async function approvePartner(partnerId: string) {
  const user = await requirePlatformAdmin();

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { rows } = await client.query(
      `SELECT * FROM partner_registration WHERE partner_id = $1 FOR UPDATE`,
      [partnerId]
    );

    const partner = rows[0];

    if (!partner) {
      throw new Error("Partner not found");
    }

    if (partner.status === "approved") {
      throw new Error("Already approved");
    }

    if (partner.status === "rejected") {
      throw new Error("Already rejected");
    }

    // if (!partner || partner.status !== "pending") {
    //   throw new Error("Invalid partner");
    // }

    const result = await createStoreFromPartner(partner);

    await client.query(
      `UPDATE partner_registration
       SET status = 'approved',
           reviewed_by = $1,
           reviewed_at = NOW()
       WHERE partner_id = $2`,
      [user.id, partnerId]
    );

    // await logAudit({
    //   actorId: user.id,
    //   action: "partner.approved",
    //   entity: "partner",
    //   entityId: partnerId,
    // });

    await logAudit({
      actorId: user.id,
      action: "partner.approved",
      entity: "partner",
      entityId: partnerId,
      metadata: {
        storeId: result.storeId,
        userId: result.userId,
      },
    });

    await client.query("COMMIT");

    
    await sendEmail({
      to: partner.business_email_address,
      subject: "Your store is approved 🎉",
      html: `
        <p>Hello ${partner.first_name},</p>
        <p>Your store has been approved.</p>
        <p><b>Login Email:</b> ${partner.business_email_address}</p>
        <p><b>Password:</b> ${result.tempPassword}</p>
      `,
    });
   

    revalidatePath("/platform/partners");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

*/
