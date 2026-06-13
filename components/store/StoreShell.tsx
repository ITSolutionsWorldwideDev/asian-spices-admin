// apps/admin/components/store/StoreShell.tsx

"use client";

import { useState } from "react";
import StoreHeader from "./Header";
import StoreSidebar from "./StoreSidebar";

export default function StoreShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      <StoreHeader
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((prev) => !prev)}
      />

      <div className="flex flex-1 overflow-hidden">
        <StoreSidebar collapsed={sidebarCollapsed} />

        <main className="flex-1 overflow-y-auto">
          <div className="p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}