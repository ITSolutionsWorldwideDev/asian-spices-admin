// components/platform/partners/actions.ts

"use server";

import { pool } from "@/core/db";
import { requirePlatformAdmin } from "@/lib/auth/guards";
import { revalidatePath } from "next/cache";
import { logAudit } from "@/lib/audit";
import { createStoreFromPartner } from "@/lib/services/partner.service";
import { sendPartnerRegistrationEmail } from "@/core/email-templates";
import { redirect } from "next/navigation";

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

    // FIX: Pass the active, transactional 'client' down directly to prevent deadlocks
    const result = await createStoreFromPartner(client, partner);

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
