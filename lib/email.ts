// apps/admin/lib/email.ts

import nodemailer from "nodemailer";

// 1️⃣ Define a clear structural interface for the incoming payload
interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  fromAccount?: "onboarding" | "billing" | "support" | "default";
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content: any;
    contentType?: string;
  }>;
}

// 2️⃣ Centralized SMTP Configuration Profile Map
// In production, these variables should always be securely injected via your .env file
const SMTP_PROFILES = {
  default: {
    host: process.env.SMTP_DEFAULT_HOST || "smtp.mailtrap.io",
    port: parseInt(process.env.SMTP_DEFAULT_PORT || "587", 10),
    secure: process.env.SMTP_DEFAULT_SECURE === "true", // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_DEFAULT_USER || "",
      pass: process.env.SMTP_DEFAULT_PASS || "",
    },
    fromAddress:
      process.env.SMTP_DEFAULT_FROM || '"Acme Platform" <no-reply@/core.com>',
  },
  onboarding: {
    host: process.env.SMTP_ONBOARDING_HOST || "smtp.mailtrap.io",
    port: parseInt(process.env.SMTP_ONBOARDING_PORT || "587", 10),
    secure: process.env.SMTP_ONBOARDING_SECURE === "true",
    auth: {
      user: process.env.SMTP_ONBOARDING_USER || "",
      pass: process.env.SMTP_ONBOARDING_PASS || "",
    },
    fromAddress:
      process.env.SMTP_ONBOARDING_FROM ||
      '"Acme Onboarding" <partners@/core.com>',
  },
  billing: {
    host: process.env.SMTP_BILLING_HOST || "smtp.mailtrap.io",
    port: parseInt(process.env.SMTP_BILLING_PORT || "587", 10),
    secure: process.env.SMTP_BILLING_SECURE === "true",
    auth: {
      user: process.env.SMTP_BILLING_USER || "",
      pass: process.env.SMTP_BILLING_PASS || "",
    },
    fromAddress:
      process.env.SMTP_BILLING_FROM || '"Acme Billing" <finance@/core.com>',
  },
  support: {
    host: process.env.SMTP_SUPPORT_HOST || "smtp.mailtrap.io",
    port: parseInt(process.env.SMTP_SUPPORT_PORT || "587", 10),
    secure: process.env.SMTP_SUPPORT_SECURE === "true",
    auth: {
      user: process.env.SMTP_SUPPORT_USER || "",
      pass: process.env.SMTP_SUPPORT_PASS || "",
    },
    fromAddress:
      process.env.SMTP_SUPPORT_FROM || '"Acme Support" <support@/core.com>',
  },
};

type ProfileKey = keyof typeof SMTP_PROFILES;

// 3️⃣ Global Transport Cache Map
// Prevents your Next.js application from creating redundant connections on every re-render/re-validation
const transporterCache = new Map<string, nodemailer.Transporter>();

/**
 * Retrieves an existing connection transport from cache, or configures a new one
 */
function getTransporter(profileKey: ProfileKey): {
  transporter: nodemailer.Transporter;
  fromAddress: string;
} {
  const profile = SMTP_PROFILES[profileKey] || SMTP_PROFILES.default;

  if (!transporterCache.has(profileKey)) {
    const transporter = nodemailer.createTransport({
      host: profile.host,
      port: profile.port,
      secure: profile.secure,
      auth: {
        user: profile.auth.user,
        pass: profile.auth.pass,
      },
      // Pool configurations maximize execution throughput in a high-traffic SaaS environment
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
    });

    transporterCache.set(profileKey, transporter);
  }

  return {
    transporter: transporterCache.get(profileKey)!,
    fromAddress: profile.fromAddress,
  };
}

/**
 * Dispatches a transaction email using the specified platform SMTP configuration routing
 */
export async function sendEmail({
  to,
  subject,
  html,
  fromAccount = "default",
  replyTo,
  attachments,
}: EmailOptions) {
  // Gracefully fallback if an invalid profile key is given
  const profileKey: ProfileKey = SMTP_PROFILES[fromAccount]
    ? fromAccount
    : "default";

  const { transporter, fromAddress } = getTransporter(profileKey);

  const mailOptions = {
    from: fromAddress,
    to,
    subject,
    html,
    replyTo,
    attachments,
  };

  try {
    const info = await transporter.sendMail(mailOptions);

    // In development environments, this will output handy tracking URLs from providers like Mailtrap
    if (process.env.NODE_ENV !== "production") {
      console.log(
        `[Email Sent] Message ID: ${info.messageId} via profile: [${profileKey}]`,
      );
    }

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(
      `[Email Failure] Failed to send email via profile: [${profileKey}]:`,
      error,
    );
    throw new Error(
      `Email dispatch failed via SMTP routing profile: ${profileKey}`,
    );
  }
}
