import { sendEmail } from "../email";

interface TempPasswordLockedSupportEmailOptions {
  email: string;
  firstName?: string;
  loginEmail?: string;
  companyName?: string;
}

/** Sent after the second 72h temporary-password expiry (account needs support). */
export async function sendTempPasswordLockedSupportEmail({
  email,
  firstName,
  loginEmail,
  companyName,
}: TempPasswordLockedSupportEmailOptions) {
  try {
    const name = firstName || "Partner";
    const supportEmail = "support@asianspices.online";
    const emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; padding: 25px; border-radius: 12px; color: #1f2937;">
        <h2 style="color: #ea580c; text-align: center; margin-bottom: 20px;">Login Password Updated</h2>
        <p>Hello ${name},</p>
        <p>
          Your temporary password for${companyName ? ` <strong>${companyName}</strong>` : " your Asian Spices store account"}
          was not changed in time, so it has been rotated again for security.
        </p>
        <p>
          You cannot log in with the previous password. Please contact support so we can help you regain access.
        </p>
        <div style="background-color: #f9fafb; border-left: 4px solid #ea580c; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0 0 8px 0;"><strong>Support:</strong> ${supportEmail}</p>
          ${loginEmail ? `<p style="margin: 0;"><strong>Account email:</strong> ${loginEmail}</p>` : ""}
        </div>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 25px 0;" />
        <p style="font-size: 12px; color: #6b7280; text-align: center; margin: 0;">
          © 2026 Asian Spices Merchant Network. All rights reserved.
        </p>
      </div>
    `;

    await sendEmail({
      to: email,
      cc: [
        "partners@asianspices.online",
        "ahmad.raza@itsolutionshub2010.com",
      ],
      subject: "Asian Spices — password changed, contact support to log in",
      html: emailHtml,
      fromAccount: "support",
    });

    console.log(`[Temp Password Locked Email Sent] to=${email}`);
    return { success: true };
  } catch (error) {
    console.error(`[Temp Password Locked Email Failure] to=${email}`, error);
    return { success: false, error };
  }
}
