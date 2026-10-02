// core/email.ts
import nodemailer from "nodemailer";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  fromAccount?: "billing" | "order" | "partners" | "support" | "default";
  replyTo?: string;
  cc?: string | string[];
  attachments?: Array<{
    filename: string;
    content: any;
    contentType?: string;
  }>;
}

const SMTP_PROFILES = {
  default: {
    host: "mail.asianspices.online",
    port: 465,
    secure: true,
    auth: {
      user: process.env.SMTP_ORDER_USER || "order@asianspices.online",
      pass: process.env.SMTP_ORDER_PASS || "",
    },
    fromAddress: '"Asian Spices Orders" <order@asianspices.online>',
  },
  order: {
    host: "mail.asianspices.online",
    port: 465,
    secure: true,
    auth: {
      user: process.env.SMTP_ORDER_USER || "order@asianspices.online",
      pass: process.env.SMTP_ORDER_PASS || "",
    },
    fromAddress: '"Asian Spices Orders" <order@asianspices.online>',
  },
  billing: {
    host: "mail.asianspices.online",
    port: 465,
    secure: true,
    auth: {
      user: process.env.SMTP_FINANCE_USER || "finance@asianspices.online",
      pass: process.env.SMTP_FINANCE_PASS || "",
    },
    fromAddress: '"Asian Spices Finance" <finance@asianspices.online>',
  },

  partners: {
    host: "mail.asianspices.online",
    port: 465,
    secure: true,
    auth: {
      user: process.env.SMTP_PARTNERS_USER || "partners@asianspices.online",
      pass: process.env.SMTP_PARTNERS_PASS || "",
    },
    fromAddress: '"Asian Spices Partners" <partners@asianspices.online>',
  },
  
  support: {
    host: "mail.asianspices.online",
    port: 465,
    secure: true,
    auth: {
      user: process.env.SMTP_SUPPORT_USER || "support@asianspices.online",
      pass: process.env.SMTP_SUPPORT_PASS || "",
    },
    fromAddress: '"Asian Spices Support" <support@asianspices.online>',
  },
};

type ProfileKey = keyof typeof SMTP_PROFILES;
const transporterCache = new Map<string, nodemailer.Transporter>();

function getTransporter(profileKey: ProfileKey) {
  const profile = SMTP_PROFILES[profileKey] || SMTP_PROFILES.default;

  if (!transporterCache.has(profileKey)) {
    // NOTE: pooling is intentionally OFF. Pooled transporters keep SMTP sockets
    // open; with dev hot-reloads (and other apps on this machine) those idle
    // sockets pile up and the mail server (Exim) starts rejecting new
    // connections with a *plaintext* "421 Too many concurrent SMTP connections",
    // which a TLS client reports as "ssl3_get_record:wrong version number".
    // Volume here is tiny, so one connection per message is the safe choice.
    const transporter = nodemailer.createTransport({
      host: profile.host,
      port: profile.port,
      secure: profile.secure,
      auth: {
        user: profile.auth.user,
        pass: profile.auth.pass,
      },
      pool: false,
      connectionTimeout: 20000,
      greetingTimeout: 20000,
      socketTimeout: 30000,
    } as any);
    transporterCache.set(profileKey, transporter);
  }

  return {
    transporter: transporterCache.get(profileKey)!,
    fromAddress: profile.fromAddress,
  };
}

export async function sendEmail({
  to,
  subject,
  html,
  fromAccount = "default",
  replyTo,
  cc,
  attachments,
}: EmailOptions) {
  const profileKey: ProfileKey = SMTP_PROFILES[fromAccount]
    ? fromAccount
    : "default";
 
  // const defaultCC = ["admin@asianspices.online", "backup@asianspices.online"];
  // const finalCC = cc ? (Array.isArray(cc) ? [...cc, ...defaultCC] : [cc, ...defaultCC]) : defaultCC;

  // Plain-text alternative improves deliverability (spam scoring) for HTML-only mail
  const text = html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|h[1-6]|li|tr)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  const buildOptions = (fromAddress: string) => ({
    from: fromAddress,
    to,
    cc,
    subject,
    html,
    text,
    replyTo,
    attachments,
  });

  // Attempt order (with a short back-off between attempts so a transient
  // network/TLS blip or a connection-limit rejection doesn't take out every
  // attempt at once):
  //  1. cached transporter for the requested profile (465, implicit TLS)
  //  2. fresh connection, same profile, 465 implicit TLS
  //  3. fresh connection, same profile, 587 STARTTLS — tolerates a server that
  //     answers in plaintext first ("ssl3_get_record:wrong version number")
  //  4. fresh connection via the default profile, 465
  //  5. fresh connection via the default profile, 587 STARTTLS
  type Attempt = {
    label: string;
    key: ProfileKey;
    fresh: boolean;
    starttls?: boolean;
    delayMs: number;
  };
  // Delays grow so that a "421 Too many concurrent SMTP connections" window
  // (idle sockets being released by the server) has time to clear.
  const attempts: Attempt[] = [
    { label: `${profileKey} (465)`, key: profileKey, fresh: false, delayMs: 0 },
    { label: `${profileKey} (fresh 465)`, key: profileKey, fresh: true, delayMs: 3000 },
    { label: `${profileKey} (fresh 587 STARTTLS)`, key: profileKey, fresh: true, starttls: true, delayMs: 5000 },
  ];
  if (profileKey !== "default") {
    attempts.push(
      { label: "default (fresh 465 fallback)", key: "default", fresh: true, delayMs: 7000 },
      { label: "default (fresh 587 STARTTLS fallback)", key: "default", fresh: true, starttls: true, delayMs: 10000 },
    );
  }

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  let lastError: unknown = null;
  for (const attempt of attempts) {
    if (attempt.delayMs) await sleep(attempt.delayMs);

    const profile = SMTP_PROFILES[attempt.key];
    const transporter = attempt.fresh
      ? nodemailer.createTransport({
          host: profile.host,
          port: attempt.starttls ? 587 : profile.port,
          secure: attempt.starttls ? false : profile.secure,
          requireTLS: attempt.starttls ? true : undefined,
          auth: { user: profile.auth.user, pass: profile.auth.pass },
          connectionTimeout: 20000,
          greetingTimeout: 20000,
          socketTimeout: 30000,
        } as any)
      : getTransporter(attempt.key).transporter;

    try {
      const info = await transporter.sendMail(buildOptions(profile.fromAddress));
      console.log(
        `[Email Sent] ID: ${info.messageId} via [${attempt.label}] to=${Array.isArray(to) ? to.join(",") : to} accepted=${JSON.stringify(info.accepted)} rejected=${JSON.stringify(info.rejected)}`,
      );
      if (attempt.fresh) transporter.close();
      return { success: true, messageId: info.messageId };
    } catch (error: any) {
      lastError = error;
      console.error(
        `[Email Failure] via [${attempt.label}] to=${to} code=${error?.code ?? "-"} command=${error?.command ?? "-"}:`,
        error?.message ?? error,
      );
      if (attempt.fresh) transporter.close();
      if (!attempt.fresh) {
        // Drop the possibly-broken pooled transporter so the next call rebuilds it
        try {
          getTransporter(attempt.key).transporter.close();
        } catch {}
        transporterCache.delete(attempt.key);
      }
    }
  }

  throw new Error(
    `Email dispatch failed via SMTP profile: ${profileKey} (${
      lastError instanceof Error ? lastError.message : String(lastError)
    })`,
  );
}
