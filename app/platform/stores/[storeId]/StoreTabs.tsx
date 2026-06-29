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


  const activeIndex = Math.max(
    tabs.findIndex((t) => t.isActive),
    0,
  );

  return (
    <div className="relative flex gap-2 bg-gray-100 p-1 rounded-xl w-fit pr-0">
      <div
        className="absolute top-1 bottom-1 rounded-lg bg-white shadow-sm transition-all duration-300"
        style={{
          width: `${100 / tabs.length}%`,
          transform: `translateX(${activeIndex * 100}%)`,
        }}
      />

      {tabs.map((tab) => {
        const Icon = tab.icon;

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`relative z-10 flex hover:scale-[1.03] active:scale-[0.98] items-center gap-2 px-4 py-2 text-sm font-medium transition-colors
              ${
                tab.isActive
                  ? "text-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }
            `}
          >
            <Icon
              size={16}
              className={`transition-colors ${
                tab.isActive ? "text-blue-600 scale-110" : "text-gray-500"
              }`}
            />

            <span>{tab.label}</span>
          </Link>
        );
      })}
    </div>
  );
}

