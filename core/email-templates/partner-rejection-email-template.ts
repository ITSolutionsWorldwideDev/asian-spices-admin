import { sendEmail } from "../email";
import { generatePartnerRejectionEmailHtml } from "../utils/mails/partner-rejection";

interface PartnerRejectionEmailOptions {
  email: string;
  companyName?: string;
  firstName?: string;
  applicationId?: string;
  reason?: string;
}

export async function sendPartnerRejectionEmail({
  email,
  companyName,
  firstName,
  applicationId,
  reason,
}: PartnerRejectionEmailOptions) {
  try {
    const emailHtml = generatePartnerRejectionEmailHtml({
      email,
      companyName,
      firstName: firstName || "Partner",
      applicationId: applicationId || undefined,
      reason,
    });

    await sendEmail({
      to: email,
      cc: [
        "cheila.lopes@itsolutionshub2010.com",
        "ahmed.mehmood@itsolutionshub2010.com",
      ],
      subject: `Update over uw Asian Spices partneraanvraag${applicationId ? ` - ${applicationId}` : ""}`,
      html: emailHtml,
      fromAccount: "partners",
    });

    console.log(
      `[Partner Rejection Email Sent] to=${email} applicationId=${applicationId || "n/a"}`,
    );
    return { success: true };
  } catch (error) {
    console.error(
      `[Partner Rejection Email Failure] to=${email} applicationId=${applicationId || "n/a"}`,
      error,
    );
    return { success: false, error };
  }
}
