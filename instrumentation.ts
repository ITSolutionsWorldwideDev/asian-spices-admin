export async function register() {
  // Only start background jobs in the Node server runtime.
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const g = globalThis as typeof globalThis & {
    __tempPasswordExpiryCronStarted?: boolean;
  };

  // Avoid duplicate schedules on Next.js hot reload in development.
  if (g.__tempPasswordExpiryCronStarted) return;
  g.__tempPasswordExpiryCronStarted = true;

  const cron = (await import("node-cron")).default;
  const baseUrl =
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "http://localhost:3003";

  // Call the HTTP route instead of importing the module directly.
  // That avoids stale Turbopack/instrumentation module caches in dev.
  cron.schedule("*/5 * * * *", async () => {
    try {
      const res = await fetch(`${baseUrl}/api/cron/temp-password-expiry`, {
        method: "GET",
        cache: "no-store",
      });
      const summary = await res.json().catch(() => null);
      console.log("[cron/temp-password-expiry]", res.status, summary);
    } catch (error) {
      console.error("[cron/temp-password-expiry]", error);
    }
  });

  console.log(
    "[cron/temp-password-expiry] auto-scheduled every 5 minutes via",
    `${baseUrl}/api/cron/temp-password-expiry`,
  );
}
