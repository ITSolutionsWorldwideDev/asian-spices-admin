// components/platform/partners/actions.ts

"use server";

import { pool } from "@/core/db";
import { requirePlatformAdmin } from "@/lib/auth/guards";
import { revalidatePath } from "next/cache";
import { logAudit } from "@/lib/audit";
import { createStoreFromPartner } from "@/lib/services/partner.service";
import { sendPartnerRegistrationEmail } from "@/core/email-templates";
import { generateUniqueApplicationId } from "@/lib/services/applicationId";
import { redirect } from "next/navigation";

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
  } = data;

  const resolvedCompanyName = String(companyName || name || "").trim();
  if (!resolvedCompanyName) {
    return { success: false, error: "Company / store name is required" };
  }
  if (!businessEmail) {
    return { success: false, error: "Business email is required" };
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

    await logAudit({
      actorId: user.id,
      action: "partner.created",
      entity: "partner",
      entityId: partnerId,
      metadata: { applicationId },
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
    };

    if (existingStore.rows.length > 0) {
      const storeId = existingStore.rows[0].id as string;
      await client.query(
        `UPDATE stores SET status = 'active' WHERE id = $1`,
        [storeId],
      );
      result = { storeId, userId: "" };
    } else {
      // FIX: Pass the active, transactional 'client' down directly to prevent deadlocks
      result = await createStoreFromPartner(client, partner);
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

  // Same Partner Application Received template as shown in production
  if (emailPayload && partnerEmail && partnerApplicationId) {
    await sendPartnerRegistrationEmail({
      email: partnerEmail,
      companyName: partnerCompanyName || "Your company",
      firstName: partnerFirstName || "Partner",
      applicationId: partnerApplicationId,
    });
  }

  revalidatePath("/platform/partners");
  return { success: true };
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

  try {
    await client.query("BEGIN");

    // Fetch details inside the transaction before making structural adjustments
    const { rows } = await client.query(
      `SELECT first_name, business_email_address, status FROM partner_registration WHERE partner_id = $1 FOR UPDATE`,
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
  /* try {
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
  } catch (mailErr) {
    console.error(
      "Database updated but rejection email failed to dispatch:",
      mailErr,
    );
  } */

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
