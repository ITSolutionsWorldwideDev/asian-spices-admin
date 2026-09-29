"use client";

import { useSession } from "next-auth/react";

import { DeferredGenieChatWidget } from "@/components/chatbot/DeferredGenieChatWidget";

/**
 * Genie is a Partner Portal helper, so it should only appear for signed-in
 * partners — not superadmins / platform admins. Gating on the session also
 * keeps it off the login / unauthorized screens (ticket 196).
 */
export function AuthedGenieChatWidget() {
  const { data: session, status } = useSession();

  if (status !== "authenticated") return null;
  if (session?.user?.isPlatformAdmin) return null;

  return <DeferredGenieChatWidget />;
}
