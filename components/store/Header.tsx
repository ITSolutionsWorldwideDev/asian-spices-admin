// components/store/Header.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronsLeft } from "react-feather";
import { signOut, useSession } from "next-auth/react";
import { useStore } from "../store-context";

interface HeaderProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function StoreHeader({ collapsed, onToggle }: HeaderProps) {
  const { data: session } = useSession();
  const pathname = usePathname();

  const store = useStore();

  const storeId = store.id;
  const storeName = store.name;

  // const [toggle, setToggle] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  // const [mobileDropdownOpen, setMobileDropdownOpen] = useState(false);

  // const handleSidebar = () => {
  //   document.body.classList.toggle("mini-sidebar");
  //   setToggle(!toggle);
  // };

  useEffect(() => {
    setProfileDropdownOpen(false);
  }, [pathname]);

  // useEffect(() => {
  //   document.body.classList.remove("slide-nav", "expand-menu");
  //   setMobileDropdownOpen(false);
  // }, [pathname]);

  return (
    <header className="h-16 border-b bg-white flex items-center justify-between px-6 py-2 shrink-0">
      <div className="flex items-center gap-4">
        {/* <button
          onClick={handleSidebar}
          className="p-2 rounded-lg hover:bg-gray-100"
        >
          <ChevronsLeft size={18} />
        </button> */}
        <button onClick={onToggle} className="p-2 rounded-lg hover:bg-gray-100">
          <ChevronsLeft
            size={18}
            className={`transition-transform ${collapsed ? "rotate-180" : ""}`}
          />
        </button>

        <Link
          href={`/dashboard`}
          className="flex items-center gap-2"
        >
          <img src="/assets/img/logo.svg" alt="Logo" className="max-h-8 w-auto max-w-[120px] object-contain" />

          <span className="font-semibold">{storeName}</span>
        </Link>
      </div>
      <div className="relative">
        <button
          onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
          className="flex items-center rounded-full hover:bg-gray-100 p-1"
        >
          <img
            src="/assets/img/profiles/avator1.jpg"
            alt="Profile"
            className="h-8 w-8 rounded-full"
          />
        </button>

        {profileDropdownOpen && (
          <div className="absolute right-0 mt-2 w-56 bg-white border rounded-md shadow-lg">
            <div className="p-3 border-b">
              <p className="font-medium text-sm">
                {session?.user?.email ?? "Guest"}
              </p>
              <p className="text-xs text-gray-500">Store: {storeName}</p>
            </div>

            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
{
  /* <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="flex items-center justify-between px-4 py-2">

        <div className="flex items-center space-x-3">
          <Link
            href={`/${storeId}/dashboard`}
            className="flex items-center space-x-2"
          >
            <img src="/assets/img/logo.svg" alt="Logo" className="h-8" />
            <span className="font-semibold text-sm text-gray-700">
              {storeName}
            </span>
          </Link>

          <button
            onClick={handleSidebar}
            className="hidden md:flex p-1 hover:bg-gray-100 rounded-md"
          >
            <ChevronsLeft className="w-5 h-5" />
          </button>
        </div>

  
        <div className="relative">
          <button
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="flex items-center rounded-full hover:bg-gray-100 p-1"
          >
            <img
              src="/assets/img/profiles/avator1.jpg"
              alt="Profile"
              className="h-8 w-8 rounded-full"
            />
          </button>

          {profileDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white border rounded-md shadow-lg">
              <div className="p-3 border-b">
                <p className="font-medium text-sm">
                  {session?.user?.email ?? "Guest"}
                </p>
                <p className="text-xs text-gray-500">Store: {storeName}</p>
              </div>

              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header> */
}
