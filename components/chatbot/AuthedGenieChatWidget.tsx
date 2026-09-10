"use client";

import { useSession } from "next-auth/react";

import { DeferredGenieChatWidget } from "@/components/chatbot/DeferredGenieChatWidget";

/**
 * Genie is a Partner Portal helper, so it should only appear for signed-in
 * users. Gating on the session keeps it off the login / unauthorized screens
 * (ticket 196).
 */
export function AuthedGenieChatWidget() {
  const { status } = useSession();

  if (status !== "authenticated") return null;

  return <DeferredGenieChatWidget />;
}
