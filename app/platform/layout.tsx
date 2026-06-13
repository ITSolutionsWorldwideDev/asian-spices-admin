// app/(platform)/platform/layout.tsx

import PlatformHeader from "@/components/platform/Header";
import PlatformSidebar from "@/components/platform/Sidebar";
import { requirePlatformAdmin } from "@/lib/auth/guards";
import { ToastProvider } from "@/core/ui";

import "../layout.css";

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePlatformAdmin();

  return (
    <ToastProvider>
      <div className="main-wrapper">
        <PlatformHeader />
        <PlatformSidebar />
        <main>{children}</main>
      </div>
    </ToastProvider>
  );
}
