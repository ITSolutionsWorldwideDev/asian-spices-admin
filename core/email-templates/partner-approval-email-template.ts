import { sendEmail } from "../email";
import { generatePartnerCredentialsEmailHtml } from "../utils/mails/partner-credentials";

interface PartnerApprovalEmailOptions {
  email: string;
  companyName: string;
  firstName: string;
  applicationId?: string;
  tempPassword: string;
  loginEmail?: string;
  /** Optional second account (Initial Admin) shown in the same approval email */
  adminLoginEmail?: string;
  adminPassword?: string;
}

export async function sendPartnerApprovalEmail({
  email,
  companyName,
  firstName,
  applicationId,
  tempPassword,
  loginEmail,
  adminLoginEmail,
  adminPassword,
}: PartnerApprovalEmailOptions) {
  try {
    const accountEmail = loginEmail || email;
    const sameAccount =
      Boolean(adminLoginEmail && adminPassword) &&
      accountEmail.trim().toLowerCase() ===
        String(adminLoginEmail).trim().toLowerCase();
    const adminBlock =
      !sameAccount && adminLoginEmail && adminPassword
        ? `
        <div style="background-color: #f9fafb; border-left: 4px solid #2563eb; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0 0 8px 0;"><strong>Store Admin Login Email:</strong> ${adminLoginEmail}</p>
          <p style="margin: 0;"><strong>Store Admin Password:</strong> ${adminPassword}</p>
        </div>`
        : "";
    const loginPassword =
      sameAccount && adminPassword ? adminPassword : tempPassword;
    const loginLabel = sameAccount ? "Password" : "Store Owner Password";
    const loginEmailLabel = sameAccount ? "Login Email" : "Store Owner Login Email";

    // Generate new branded HTML credentials template
    const emailHtml = generatePartnerCredentialsEmailHtml({
      firstName: firstName || "Partner",
      companyName: companyName || undefined,
      applicationId: applicationId || undefined,
      username: accountEmail,
      tempPassword: loginPassword,
      loginEmailLabel,
      loginPasswordLabel: loginLabel,
      adminLoginEmail: !sameAccount ? adminLoginEmail : undefined,
      adminPassword: !sameAccount ? adminPassword : undefined,
    });

    /* [OLD TEMPLATE COMMENTED OUT]
    const oldEmailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; padding: 25px; border-radius: 12px; color: #1f2937;">
        <h2 style="color: #ea580c; text-align: center; margin-bottom: 20px;">Your Store is Approved!</h2>
        <p>Hello ${firstName || "Partner"},</p>
        <p>Your partner store application for <strong>${companyName || "your company"}</strong> has been approved${applicationId ? ` (Application ID: <code>${applicationId}</code>)` : ""}.</p>
        <div style="background-color: #f9fafb; border-left: 4px solid #ea580c; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0 0 8px 0;"><strong>${loginEmailLabel}:</strong> ${accountEmail}</p>
          <p style="margin: 0;"><strong>${loginLabel}:</strong> ${loginPassword}</p>
        </div>
        ${adminBlock}
        <p>Please sign in and change your password after your first login.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 25px 0;" />
        <p style="font-size: 12px; color: #6b7280; text-align: center; margin: 0;">
          © 2026 Asian Spices Merchant Network. All rights reserved.
        </p>
      </div>
    `;
    */

    await sendEmail({
      to: email,
      bcc: [
        "partners@asianspices.online",
        "ahmad.raza@itsolutionshub2010.com",
        "zraja@itsolutionsworldwide.com",
        "sdevi@itsolutionsworldwide.com",
      ],
      subject: `Your Asian Spices Store is Approved${applicationId ? ` - ${applicationId}` : ""}`,
      html: emailHtml,
      fromAccount: "partners",
    });

    console.log(
      `[Partner Approval Email Sent] to=${email} applicationId=${applicationId || "n/a"}`,
    );
    return { success: true };
  } catch (error) {
    console.error(
      `[Partner Approval Email Failure] to=${email} applicationId=${applicationId || "n/a"}`,
      error,
    );
    return { success: false, error };
  }
}
