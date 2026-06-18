// components/store/Sidebar.tsx
"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { ChevronsLeft } from "react-feather";

export default function StoreSidebar({ storeId }: { storeId: string }) {
  const pathname = usePathname();
  const { data: session } = useSession();

  const MENU = [
  { label: "Dashboard", link: `/dashboard` },
  { label: "Products", link: `/products` },
  { label: "Orders", link: `/orders` },
  { label: "Customers", link: `/customers` },
  { label: "Settings", link: `/settings` },
];

  return (
    <div className="sidebar active">
      <div className="sidebar-logo p-3 flex items-center justify-between">
        <Link href={`/${storeId}/dashboard`} className="logo">
          <img src="/assets/img/logo.svg" alt="Logo" />
        </Link>
        <button>
          <ChevronsLeft />
        </button>
      </div>

      <div className="sidebar-inner">
        <ul>
          {MENU.map((item) => (
            <li
              key={item.link}
              className={pathname.startsWith(item.link) ? "active" : ""}
            >
              <Link href={item.link}>{item.label}</Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
