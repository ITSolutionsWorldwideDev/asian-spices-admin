// components/shipping/store/ShippingTabs.tsx

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function ShippingTabs({ storeId }: { storeId: string }) {
  const pathname = usePathname();

  const base = `/platform/stores/${storeId}/shipping`;

  const tabs = [
    { label: "Providers", href: `${base}/providers` },
    { label: "Methods", href: `${base}/methods` },
    { label: "Rates", href: `${base}/rates` },
  ];

  return (
    <div className="flex gap-2 border-b pb-3 mb-4">
      {tabs.map((t) => {
        // const active = pathname === t.href;

        const active = pathname.startsWith(t.href);

        return (
          <Link
            key={t.href}
            href={t.href}
            className={`px-3 py-1 text-sm rounded transition ${
              active
                ? "bg-blue-100 text-blue-600 font-medium"
                : "text-gray-600 hover:text-gray-900"
            }`}
            // className={`px-3 py-1 text-sm rounded ${
            //   active ? "bg-blue-100 text-blue-600" : "text-gray-600"
            // }`}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
