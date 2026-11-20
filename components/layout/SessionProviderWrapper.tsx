// components/SessionProviderWrapper.tsx
"use client";

import { SessionProvider } from "next-auth/react";
import ForceChangePasswordModal from "@/components/auth/ForceChangePasswordModal";

export default function SessionProviderWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      {children}
      <ForceChangePasswordModal />
    </SessionProvider>
  );
}
