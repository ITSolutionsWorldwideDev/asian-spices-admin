// app/platform/stores/[storeId]/StoreTabs.tsx

"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Settings, CreditCard, Truck } from "lucide-react";

export default function StoreTabs({ storeId }: { storeId: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentTab = searchParams.get("tab");

  const base = `/platform/stores/${storeId}`;

  const isShipping = pathname.includes("/shipping");

  const tabs = [
    {
      label: "General",
      icon: Settings,
      href: base,
      isActive: pathname === base && !currentTab,
    },
    {
      label: "Plan",
      icon: CreditCard,
      href: `${base}?tab=plan`,
      isActive: currentTab === "plan",
    },
    {
      label: "Shipping",
      icon: Truck,
      // href: `${base}/shipping`,
      href: `${base}/shipping/providers`,
      isActive: isShipping,
      // isActive: pathname.includes("shipping"),
    },
  ];


  return (
    <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl w-fit">
      {tabs.map((tab) => {
        const Icon = tab.icon;

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              tab.isActive
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-200/50"
            }`}
          >
            <Icon
              size={16}
              className={`transition-colors ${
                tab.isActive ? "text-blue-600" : "text-gray-500"
              }`}
            />

            <span>{tab.label}</span>
          </Link>
        );
      })}
    </div>
  );
}

