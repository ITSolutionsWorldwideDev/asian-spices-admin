// components/platform/Header.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronsLeft } from "react-feather";
import { signOut, useSession } from "next-auth/react";
import { all_routes as route } from "@/data/all_routes";

export default function PlatformHeader() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const [toggle, setToggle] = useState(false);
  const [expandMenus, setExpandMenus] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [mobileDropdownOpen, setMobileDropdownOpen] = useState(false);

  const handleSidebar = () => {
    document.body.classList.toggle("mini-sidebar");
    setToggle(!toggle);
  };

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      document.documentElement.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    document.body.classList.remove("slide-nav", "expand-menu");
    setExpandMenus(false);
    setMobileDropdownOpen(false);
  }, [pathname]);

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="flex items-center justify-between px-4 py-2">
        {/* LEFT */}
        <div className="flex items-center space-x-2">
          <Link href="/platform/dashboard" className="flex items-center">
            <img
              src="/assets/img/logo.svg"
              alt="Logo"
              className="h-8 w-auto"
            />
          </Link>

          {/* Desktop sidebar toggle */}
          <button
            onClick={handleSidebar}
            className="hidden md:flex p-1 hover:bg-gray-100 rounded-md"
          >
            <ChevronsLeft className="w-5 h-5" />
          </button>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileDropdownOpen(!mobileDropdownOpen)}
            className="md:hidden p-2 hover:bg-gray-100 rounded-md"
          >
            <i className="fa fa-bars" />
          </button>
        </div>

        {/* RIGHT */}
        <div className="flex items-center space-x-2">
          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="hidden md:flex p-2 rounded hover:bg-gray-100"
            title="Fullscreen"
          >
            <i className="ti ti-maximize" />
          </button>

          {/* Profile */}
          <div className="relative">
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center rounded-full hover:bg-gray-100 p-1 focus:outline-none"
            >
              <img
                src="/assets/img/profiles/avator1.jpg"
                alt="Profile"
                className="h-8 w-8 rounded-full"
              />
            </button>

            {profileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white border rounded-md shadow-lg z-50">
                <div className="flex items-center p-3 border-b">
                  <img
                    src="/assets/img/profiles/avator1.jpg"
                    alt="Profile"
                    className="h-10 w-10 rounded-full mr-2"
                  />
                  <div>
                    <h6 className="font-medium">
                      {session?.user?.email ?? "Platform Admin"}
                    </h6>
                    <p className="text-xs text-muted">
                      Super Admin
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setProfileDropdownOpen(false);
                    signOut({ callbackUrl: "/login" });
                  }}
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MOBILE DROPDOWN */}
      {mobileDropdownOpen && (
        <div className="md:hidden px-4 pb-2 bg-white border-t">
          <Link
            href="/platform/dashboard"
            className="block px-4 py-2 hover:bg-gray-100"
            onClick={() => setMobileDropdownOpen(false)}
          >
            Dashboard
          </Link>

          <Link
            href="/platform/users"
            className="block px-4 py-2 hover:bg-gray-100"
            onClick={() => setMobileDropdownOpen(false)}
          >
            Users & Roles
          </Link>

          <button
            onClick={() => {
              setMobileDropdownOpen(false);
              signOut({ callbackUrl: "/login" });
            }}
            className="block w-full text-left px-4 py-2 hover:bg-gray-100"
          >
            Logout
          </button>
        </div>
      )}
    </header>
  );
}
