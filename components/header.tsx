// components/header.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronsLeft, Search } from "react-feather";
import { signOut } from "next-auth/react";
import { all_routes as route } from "@/data/all_routes";

export default function Header() {
  const pathname = usePathname();
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
  }, [pathname]);

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center space-x-2">
          <Link href={route.dashboard} className="flex items-center">
            <img src="assets/img/logo.svg" alt="Logo" className="h-8 w-auto" />
          </Link>
          <button
            onClick={handleSidebar}
            className="hidden md:flex p-1 hover:bg-gray-100 rounded-md"
          >
            <ChevronsLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => setMobileDropdownOpen(!mobileDropdownOpen)}
            className="md:hidden p-2 hover:bg-gray-100 rounded-md"
          >
            <i className="fa fa-bars"></i>
          </button>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={toggleFullscreen}
            className="hidden md:flex p-2 rounded hover:bg-gray-100"
          >
            <i className="ti ti-maximize"></i>
          </button>
          <div className="relative">
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center rounded-full hover:bg-gray-100 p-1 focus:outline-none"
            >
              <img
                src="assets/img/profiles/avator1.jpg"
                alt="Profile"
                className="h-8 w-8 rounded-full"
              />
            </button>
            {profileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white border rounded-md shadow-lg z-50">
                <div className="flex items-center p-3 border-b">
                  <img
                    src="assets/img/profiles/avator1.jpg"
                    alt="Profile"
                    className="h-10 w-10 rounded-full mr-2"
                  />
                  <div>
                    <h6 className="font-medium">Super Admin</h6>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setProfileDropdownOpen(false);
                    signOut({ callbackUrl: route.signin });
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

      {mobileDropdownOpen && (
        <div className="md:hidden px-4 pb-2 bg-white border-t">
          <Link
            href={route.profile}
            className="block px-4 py-2 hover:bg-gray-100"
            onClick={() => setMobileDropdownOpen(false)}
          >
            My Profile
          </Link>
          <button
            onClick={() => {
              setMobileDropdownOpen(false);
              signOut({ callbackUrl: route.signin });
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

/* "use client";

import { useState, useEffect } from "react";
// import { all_routes } from "@/data/all_routes";
import { ChevronsLeft, Search } from "react-feather";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

export default function Header() {
  // const route = all_routes;
  const pathname = usePathname();
  const [toggle, setToggle] = useState(false);
  const [expandMenus, setExpandMenus] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [mobileDropdownOpen, setMobileDropdownOpen] = useState(false);

  // Sidebar toggle
  const handleSidebar = () => {
    document.body.classList.toggle("mini-sidebar");
    setToggle((prev) => !prev);
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!isFullscreen) {
      document.documentElement.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  // Expand menu on hover (desktop only)
  const expandMenuOpen = () => {
    setExpandMenus(true);
    document.body.classList.add("expand-menu");
  };
  const expandMenuClose = () => {
    setExpandMenus(false);
    document.body.classList.remove("expand-menu");
  };

  // Reset classes on route change
  useEffect(() => {
    document.body.classList.remove("slide-nav", "expand-menu");
    setExpandMenus(false);
  }, [pathname]);

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="flex items-center justify-between px-4 py-2">

        <div
          className="flex items-center space-x-2"
          onMouseOver={expandMenuOpen}
          onMouseLeave={expandMenuClose}
        >
          <Link href="/dashboard" className="flex items-center">
            <img src="assets/img/logo.svg" alt="Logo" className="h-8 w-auto" />
          </Link>

    
          <button
            onClick={handleSidebar}
            className="hidden md:flex p-1 hover:bg-gray-100 rounded-md"
          >
            <ChevronsLeft className="w-5 h-5" />
          </button>

        
          <button
            onClick={() => setMobileDropdownOpen((prev) => !prev)}
            className="md:hidden p-2 hover:bg-gray-100 rounded-md"
          >
            <i className="fa fa-bars"></i>
          </button>
        </div>


        <div className="hidden md:flex flex-1 mx-4 relative max-w-md">

        </div>


        <div className="flex items-center space-x-2">

          <button
            onClick={toggleFullscreen}
            className="hidden md:flex p-2 rounded hover:bg-gray-100"
          >
            <i className="ti ti-maximize"></i>
          </button>

          <div className="relative">
            <button
              onClick={() => setProfileDropdownOpen((prev) => !prev)}
              className="flex items-center rounded-full hover:bg-gray-100 p-1 focus:outline-none"
            >
              <img
                src="assets/img/profiles/avator1.jpg"
                alt="Profile"
                className="h-8 w-8 rounded-full"
              />
            </button>

            {profileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white border rounded-md shadow-lg z-50">
                <div className="flex items-center p-3 border-b">
                  <img
                    src="assets/img/profiles/avator1.jpg"
                    alt="Profile"
                    className="h-10 w-10 rounded-full mr-2"
                  />
                  <div>
                    <h6 className="font-medium">Super Admin</h6>
                  </div>
                </div>
                
                <button
                  onClick={() => {
                    setProfileDropdownOpen(false);
                    signOut({ callbackUrl: "admin/login" }); // redirect to login page after logout
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


      {mobileDropdownOpen && (
        <div className="md:hidden px-4 pb-2 bg-white border-t">
          <Link
            href="/profile"
            className="block px-4 py-2 hover:bg-gray-100"
            onClick={() => setMobileDropdownOpen(false)}
          >
            My Profile
          </Link>
          <Link
            href="/generalsettings"
            className="block px-4 py-2 hover:bg-gray-100"
            onClick={() => setMobileDropdownOpen(false)}
          >
            Settings
          </Link>
          <button
            onClick={() => {
              setMobileDropdownOpen(false);
              signOut({ callbackUrl: "admin/login" });
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
 */