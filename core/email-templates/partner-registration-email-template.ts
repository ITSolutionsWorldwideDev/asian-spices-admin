import { sendEmail } from "../email";
import { generatePartnerApplicationEmailHtml } from "../utils/mails/partner-application";

interface PartnerOnboardingEmailOptions {
  email: string;
  companyName: string;
  firstName: string;
  applicationId: string;
}

export async function sendPartnerRegistrationEmail({
  email,
  companyName,
  firstName,
  applicationId,
}: PartnerOnboardingEmailOptions) {
  try {
    // Generate new branded HTML template
    const emailHtml = generatePartnerApplicationEmailHtml({
      companyName,
      firstName,
      applicationId,
      email,
    });

    /* [OLD TEMPLATE COMMENTED OUT]
    const oldEmailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; padding: 25px; border-radius: 12px; color: #1f2937;">
        <h2 style="color: #ea580c; text-align: center; margin-bottom: 20px;">Partner Application Received!</h2>
        <p>Dear ${firstName},</p>
        <p>Thank you for submitting your partner store application to join the <strong>Asian Spices</strong> merchant network. We are excited about the prospect of working together to expand your reach.</p>
        
        <p>Your application is currently under review by our super admin onboarding team. You can track the progress of your onboarding file using your unique application ID below:</p>
        
        <div style="background-color: #f9fafb; border-left: 4px solid #ea580c; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0 0 6px 0; font-size: 14px; color: #4b5563;"><strong>Company Name:</strong> ${companyName}</p>
          <p style="margin: 0; font-size: 16px; color: #111827;"><strong>Application Tracking ID:</strong> <code style="background-color: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-weight: bold; color: #ea580c;">${applicationId}</code></p>
        </div>

        <p><strong>What happens next?</strong></p>
        <ul style="padding-left: 20px; line-height: 1.6;">
          <li>Our operations desk will verify your KVK and Chamber of Commerce filings.</li>
          <li>We will check your location parameters to determine optimal localized delivery zones.</li>
          <li>Once approved, you will receive credentials to access your dedicated store manager application portal.</li>
        </ul>

        <p style="margin-top: 25px;">If you have any immediate questions regarding your application compliance documents, please reply directly to this message.</p>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 25px 0;" />
        <p style="font-size: 12px; color: #6b7280; text-align: center; margin: 0;">
          © 2026 Asian Spices Merchant Network. All rights reserved.<br>
          This is an automated tracking update from your vendor portal.
        </p>
      </div>
    `;
    */

    await sendEmail({
      to: email,
      cc: [
        "partners@asianspices.online",
        "ahmad.raza@itsolutionshub2010.com",
        "zraja@itsolutionsworldwide.com",
        "sdevi@itsolutionsworldwide.com",
      ],
      subject: `Your Asian Spices Partner Application - ${applicationId}`,
      html: emailHtml,
      fromAccount: "partners",
    });

    return { success: true };
  } catch (error) {
    console.error(
      `[Partner Email Dispatch Failure] Application ID: ${applicationId}`,
      error,
    );
    return { success: false, error };
  }
}
