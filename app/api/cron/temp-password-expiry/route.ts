import { NextResponse } from "next/server";
import { processExpiredTempPasswords } from "@/core/auth/temp-password-expiry";

export async function GET(req: Request) {
  // Match order-timeout cron auth style (enable when CRON_SECRET is set in prod).
  // const auth = req.headers.get("authorization");
  // if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
  //   return new Response("Unauthorized", { status: 401 });
  // }

  void req;

  try {
    const summary = await processExpiredTempPasswords();
    return NextResponse.json({ success: true, ...summary });
  } catch (error) {
    console.error("[cron/temp-password-expiry]", error);
    return NextResponse.json({ error: "Cron failed" }, { status: 500 });
  }
}
