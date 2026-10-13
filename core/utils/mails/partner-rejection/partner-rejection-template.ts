import {
  DEFAULT_LOGO_SRC,
  DEFAULT_TIKTOK_SRC,
  DEFAULT_INSTAGRAM_SRC,
  DEFAULT_FACEBOOK_SRC,
  DEFAULT_YOUTUBE_SRC,
  renderEmailSocialFooter,
  escapeHtml,
} from '../shared';

export interface PartnerRejectionEmailData {
  firstName?: string;
  companyName?: string;
  email?: string;
  applicationId?: string;
  reason?: string;
  contactUrl?: string;
  logoUrl?: string;
  tiktokIconUrl?: string;
  instagramIconUrl?: string;
  facebookIconUrl?: string;
  youtubeIconUrl?: string;
}

const DEFAULT_REJECTION_REASON =
  'De ingediende bedrijfs- of compliancegegevens voldoen momenteel niet aan onze richtlijnen voor toelating tot het partnernetwerk.';

/**
 * Generate Partner Application Rejected HTML Email in Dutch.
 * Styled matching the brand design system (Plus Jakarta Sans, Playfair, Outlook MSO safe).
 */
export function generatePartnerRejectionEmailHtml(data: PartnerRejectionEmailData = {}): string {
  const safeFirstName = escapeHtml((data.firstName && data.firstName.trim()) || 'Partner');
  const safeCompanyName = escapeHtml((data.companyName && data.companyName.trim()) || 'uw onderneming');
  const safeAppId = escapeHtml(data.applicationId || 'APP-REFERENTIE');
  const safeReason = escapeHtml(
    (data.reason && data.reason.trim()) || DEFAULT_REJECTION_REASON
  );
  const contactUrl = data.contactUrl || 'https://www.asianspices.online/contact-us';

  const logoSrc = data.logoUrl || DEFAULT_LOGO_SRC;
  const tiktokIconSrc = data.tiktokIconUrl || DEFAULT_TIKTOK_SRC;
  const instagramIconSrc = data.instagramIconUrl || DEFAULT_INSTAGRAM_SRC;
  const facebookIconSrc = data.facebookIconUrl || DEFAULT_FACEBOOK_SRC;
  const youtubeIconSrc = data.youtubeIconUrl || DEFAULT_YOUTUBE_SRC;

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office" lang="nl">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>Update over uw partneraanvraag - Asian Spices</title>
  <!--[if gte mso 9]>
  <xml>
    <o:OfficeDocumentSettings>
      <o:AllowPNG/>
      <o:PixelsPerInch>96</o:PixelsPerInch>
    </o:OfficeDocumentSettings>
  </xml>
  <![endif]-->
  <!--[if mso]>
  <style type="text/css">
    body, table, td, tr, p, div, span, a, strong, b, em {
      font-family: Arial, 'Segoe UI', Helvetica, sans-serif !important;
    }
    table {
      border-collapse: collapse !important;
      mso-table-lspace: 0pt !important;
      mso-table-rspace: 0pt !important;
    }
  </style>
  <![endif]-->
  <!-- Web fonts intentionally omitted: @import in email triggers spam filters -->
  <style type="text/css">
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table { border-collapse: collapse !important; mso-table-lspace: 0pt; mso-table-rspace: 0pt; border: 0; }
    td, tr { border: 0; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    
    body {
      margin: 0;
      padding: 0;
      width: 100% !important;
      min-width: 100%;
      background-color: #f1f2f5;
      font-family: 'Plus Jakarta Sans', Arial, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, sans-serif;
      color: #27272a;
    }

    .email-container {
      border: 0;
    }

    @media only screen and (max-width: 620px) {
      .email-container {
        width: 100% !important;
        border-radius: 0px !important;
      }
      .hero-content-table {
        display: block !important;
        width: 100% !important;
      }
      .hero-left-td, .hero-right-td {
        display: block !important;
        width: 100% !important;
        padding-right: 0 !important;
      }
      .hero-right-td {
        margin-top: 18px !important;
      }
      .mobile-padding {
        padding-left: 20px !important;
        padding-right: 20px !important;
      }
      .mobile-social-col {
        display: inline-block !important;
        width: 46% !important;
        max-width: 160px !important;
        margin: 4px 1.5% !important;
        padding: 0 !important;
        box-sizing: border-box !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f2f5; -webkit-font-smoothing: antialiased; word-break: break-word;">
  <!-- Preheader text -->
  <div style="display: none; font-size: 1px; color: #f1f2f5; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
    Belangrijke update over uw partneraanvraag bij Asian Spices.
  </div>

  <!-- Outer Canvas -->
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#f1f2f5" style="background-color: #f1f2f5; border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
    <tr>
      <td align="center" style="padding: 28px 12px 40px 12px; border: 0;">
        <!--[if (gte mso 9)|(IE)]>
        <table role="presentation" align="center" border="0" cellspacing="0" cellpadding="0" width="600">
          <tr>
            <td align="center" valign="top" width="600">
        <![endif]-->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" class="email-container" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05); border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
          
          <!-- 1. Header with Logo -->
          <tr>
            <td style="background-color: #ffffff; padding: 26px 34px 20px 34px; border-bottom: 1px solid #f4f4f5; text-align: left;" class="mobile-padding">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
                <tr>
                  <td valign="middle" align="left" style="border: 0;">
                    <a href="https://www.asianspices.online" target="_blank" style="text-decoration: none; display: inline-block;">
                      <img src="${logoSrc}" alt="Asian Spices" width="138" style="display: block; width: 138px; max-width: 138px; height: auto; border: 0;" />
                    </a>
                  </td>
                  <td valign="middle" align="right" style="border: 0;">
                    <span style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 11px; font-weight: 700; color: #a1a1aa; text-transform: uppercase; letter-spacing: 0.8px;">
                      Partner Netwerk
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- 2. Hero Banner: Soft Rose / Rejected Review -->
          <tr>
            <td style="padding: 0; border: 0; background-color: #fef2f2;">
              <div style="padding: 34px 34px 34px 34px;" class="mobile-padding">
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" class="hero-content-table" style="border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
                  <tr>
                    <td valign="middle" align="left" style="padding-right: 20px; border: 0;" class="hero-left-td">
                      <div style="margin-bottom: 12px;">
                        <span style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 11px; font-weight: 800; letter-spacing: 1.2px; color: #b91c1c; text-transform: uppercase; background-color: #fee2e2; padding: 5px 10px; border-radius: 6px; display: inline-block;">
                          AANVRAAG NIET GOEDGEKEURD
                        </span>
                      </div>
                      <h1 style="margin: 0 0 12px 0; font-family: 'Playfair Display', Georgia, serif; font-size: 27px; line-height: 1.25; font-weight: 700; color: #18181b; letter-spacing: -0.3px;">
                        Update over uw aanvraag
                      </h1>
                      <p style="margin: 0; font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 13.5px; line-height: 22px; color: #52525b; max-width: 320px;">
                        Na zorgvuldige controle van uw dossier kunnen wij uw registratie op dit moment helaas niet goedkeuren.
                      </p>
                    </td>

                    <td valign="middle" align="center" width="165" style="border: 0;" class="hero-right-td">
                      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="150" style="border-collapse: collapse; margin: 0 auto;">
                        <tr>
                          <td style="background-color: #ffffff; border-radius: 14px; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08); border: 1px solid #fecaca; text-align: center; padding: 22px 14px;">
                            <div style="text-align: center; margin-bottom: 10px; font-size: 32px; line-height: 1;">
                              &#10006;
                            </div>
                            <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 9.5px; font-weight: 800; letter-spacing: 1.2px; color: #71717a; text-transform: uppercase; margin-bottom: 4px;">
                              STATUS
                            </div>
                            <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 13.5px; font-weight: 800; color: #dc2626;">
                              Niet Goedgekeurd
                            </div>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>

          <!-- 3. Salutation & Context -->
          <tr>
            <td style="padding: 34px 34px 20px 34px; border: 0;" class="mobile-padding">
              <p style="margin: 0 0 16px 0; font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 15px; font-weight: 600; color: #18181b; line-height: 24px;">
                Beste <span style="color: #ea580c; font-weight: 700;">${safeFirstName}</span>,
              </p>
              <p style="margin: 0 0 16px 0; font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 13.5px; line-height: 24px; color: #3f3f46;">
                Hartelijk dank voor uw interesse in het partnernetwerk van <strong>Asian Spices</strong> en de tijd die u heeft genomen voor de aanvraag van <strong>${safeCompanyName}</strong>.
              </p>
              <p style="margin: 0 0 20px 0; font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 13.5px; line-height: 24px; color: #3f3f46;">
                Onze onboardingdesk heeft uw ingezonden bedrijfs- en compliancegegevens geëvalueerd. Na deze beoordeling moeten wij u helaas meedelen dat wij uw aanvraag in de huidige vorm niet kunnen toelaten.
              </p>

              <!-- Rejection Reason Box -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #fffaf9; border: 1px solid #fecaca; border-left: 4px solid #dc2626; border-radius: 8px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 16px 18px;">
                    <div style="font-size: 11px; font-weight: 800; color: #991b1b; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 6px;">
                      Opgegeven reden / Toelichting
                    </div>
                    <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 14px; line-height: 22px; color: #18181b; margin-bottom: 10px;">
                      ${safeReason}
                    </div>
                    <div style="font-size: 12px; color: #71717a; border-top: 1px dashed #fca5a5; padding-top: 8px;">
                      Dossier Referentienummer: <code style="background-color: #fee2e2; padding: 2px 6px; border-radius: 4px; font-weight: 800; color: #991b1b; font-family: 'Courier New', Courier, monospace;">${safeAppId}</code>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- 4. Next Steps & Re-application -->
          <tr>
            <td style="padding: 0 34px 28px 34px; border: 0;" class="mobile-padding">
              <div style="padding-bottom: 12px; font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 15px; font-weight: 800; color: #18181b;">
                Wat betekent dit voor u?
              </div>

              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #fafafa; border: 1px solid #e4e4e7; border-radius: 12px;">
                <tr>
                  <td style="padding: 20px 22px;">
                    <!-- Point 1 -->
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 14px;">
                      <tr>
                        <td valign="top" width="22" style="font-size: 16px; color: #dc2626; line-height: 22px;">&bull;</td>
                        <td valign="top" style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 13px; line-height: 22px; color: #27272a;">
                          <strong>Aanvullende documentatie:</strong> Mocht deze beoordeling berusten op onvolledige of verouderde Kamer van Koophandel- of btw-documenten, dan kunt u de gecorrigeerde stukken per e-mail aanleveren.
                        </td>
                      </tr>
                    </table>

                    <!-- Point 2 -->
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td valign="top" width="22" style="font-size: 16px; color: #dc2626; line-height: 22px;">&bull;</td>
                        <td valign="top" style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 13px; line-height: 22px; color: #27272a;">
                          <strong>Opnieuw aanvragen:</strong> U behoudt altijd het recht om op een later moment opnieuw een partneraanvraag in te dienen zodra aan alle vereisten is voldaan.
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- 5. Support / Contact Card -->
          <tr>
            <td style="padding: 0 34px 28px 34px; border: 0;" class="mobile-padding">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f4f5; border-radius: 12px;">
                <tr>
                  <td style="padding: 18px 22px;">
                    <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 13.5px; font-weight: 700; color: #18181b; margin-bottom: 4px;">
                      Heeft u vragen of toelichting nodig?
                    </div>
                    <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 12.5px; line-height: 20px; color: #52525b; margin-bottom: 8px;">
                      Reageer gerust direct op deze e-mail of neem contact op via <a href="mailto:partners@asianspices.com" style="color: #ea580c; text-decoration: underline; font-weight: 600;">partners@asianspices.com</a>. Ons team helpt u graag verder.
                    </div>
                    <div>
                      <a href="${contactUrl}" target="_blank" style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 12px; font-weight: 800; color: #ea580c; text-decoration: none;">
                        Naar contactpagina &rarr;
                      </a>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- 6. Shared Bulletproof Social Footer -->
          ${renderEmailSocialFooter({
            logoUrl: logoSrc,
            tiktokIconUrl: tiktokIconSrc,
            instagramIconUrl: instagramIconSrc,
            facebookIconUrl: facebookIconSrc,
            youtubeIconUrl: youtubeIconSrc,
            signoffText: 'Met vriendelijke groet,<br /><strong style="color: #18181b; font-weight: 800;">Het onboardingsteam van Asian Spices</strong>',
            subtext: 'Hartelijk dank voor uw interesse in het Asian Spices Partner Netwerk.',
          })}

        </table>
        <!--[if (gte mso 9)|(IE)]>
            </td>
          </tr>
        </table>
        <![endif]-->
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Plain-text fallback for partner rejection email.
 */
export function generatePartnerRejectionEmailText(data: PartnerRejectionEmailData = {}): string {
  const safeFirstName = (data.firstName && data.firstName.trim()) || 'Partner';
  const safeCompanyName = (data.companyName && data.companyName.trim()) || 'uw onderneming';
  const safeAppId = data.applicationId || 'APP-REFERENTIE';
  const safeReason = (data.reason && data.reason.trim()) || DEFAULT_REJECTION_REASON;
  const contactUrl = data.contactUrl || 'https://www.asianspices.online/contact-us';

  return `ASIAN SPICES - UPDATE OVER UW PARTNERAANVRAAG
==================================================

Beste ${safeFirstName},

Hartelijk dank voor uw interesse in het partnernetwerk van Asian Spices en de tijd die u heeft genomen voor de aanvraag van ${safeCompanyName}.

Onze onboardingdesk heeft uw ingezonden gegevens en compliance-documenten geëvalueerd. Na deze beoordeling moeten wij u helaas meedelen dat wij uw aanvraag in de huidige vorm niet kunnen toelaten.

REDEN VAN AFWIJZING / TOELICHTING:
--------------------------------------------------
${safeReason}

Dossier Referentienummer: ${safeAppId}

WAT BETEKENT DIT VOOR U?
• Aanvullende documentatie: Mocht deze beoordeling berusten op onvolledige of verouderde documenten, dan kunt u de gecorrigeerde stukken per e-mail aanleveren.
• Opnieuw aanvragen: U behoudt het recht om op een later moment opnieuw een partneraanvraag in te dienen.

VRAGEN OF TOELICHTING?
Reageer direct op deze e-mail of neem contact op via:
partners@asianspices.com | ${contactUrl}

--------------------------------------------------
Met vriendelijke groet,
Het onboardingsteam van Asian Spices
`;
}
