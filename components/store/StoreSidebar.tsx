// apps/admin/components/store/StoreSidebar.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import PerfectScrollbar from "react-perfect-scrollbar";
import "react-perfect-scrollbar/dist/css/styles.css";
import { SidebarData } from "@/data/sidebar_data";
import { ChevronsLeft } from "react-feather";

interface SidebarProps {
  collapsed: boolean;
}

export default function StoreSidebar({ collapsed }: SidebarProps) {
  const pathname = usePathname();
  const [subOpen, setSubOpen] = useState("");
  const [subSidebar, setSubSidebar] = useState("");
  // const [toggle, setToggle] = useState(false);
  // const [expandMenus, setExpandMenus] = useState(false);

  const toggleSidebar = (title: string) => {
    setSubOpen(subOpen === title ? "" : title);
  };

  const toggleSubSidebar = (title: string) => {
    setSubSidebar(subSidebar === title ? "" : title);
  };

  // const handleSidebar = () => {
  //   document.body.classList.toggle("mini-sidebar");
  //   setToggle(!toggle);
  // };

  // const expandMenuOpen = () => {
  //   setExpandMenus(true);
  //   document.body.classList.add("expand-menu");
  // };

  // const expandMenuClose = () => {
  //   setExpandMenus(false);
  //   document.body.classList.remove("expand-menu");
  // };

  // useEffect(() => {
  //   document.body.classList.toggle("expand-menu", expandMenus);
  // }, [expandMenus]);

  return (
    // <div
    //   // className={`sidebar ${toggle ? "" : "active"} ${expandMenus ? "expand-menu" : ""}`}
    //   className={`
    //     bg-white
    //     border-r
    //     transition-all
    //     duration-300
    //     h-full
    //     overflow-hidden
    //     ${toggle ? "w-20" : "w-64"}
    //   `}
    //   onMouseOver={expandMenuOpen}
    //   onMouseLeave={expandMenuClose}
    // >
    <div
      className={`
    bg-white
    border-r
    transition-all
    duration-300
    h-full
    flex
    flex-col
    ${collapsed ? "w-20" : "w-64"}
  `}
    >
      {/* <div className="sidebar-logo p-3 flex items-center justify-between">
        <Link href="/dashboard" className="logo">
          <img src="/assets/img/logo.svg" alt="Logo" />
        </Link>
        <button id="toggle_btn" onClick={handleSidebar}>
          <ChevronsLeft />
        </button>
      </div> */}
      <div className="h-16 border-b flex items-center justify-center">
        {collapsed ? (
          <img src="/assets/img/logo.svg" alt="Logo" className="h-8 w-8" />
        ) : (
          <img
            src="/assets/img/logo.svg"
            alt="Logo"
            className="max-h-7 w-auto max-w-[140px]"
          />
        )}
      </div>

      {/* <PerfectScrollbar> */}
      <div className="flex-1 overflow-y-auto">
        <div className="sidebar-inner slimscroll">
          <div id="sidebar-menu" className="sidebar-menu">
            <ul>
              {SidebarData.map((mainItem, idx) => (
                <li key={idx} className="submenu-open">
                  {/* <h6 className="submenu-hdr">{mainItem.submenuHdr}</h6> */}
                  {!collapsed && (
                    <h6 className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase">
                      {mainItem.submenuHdr}
                    </h6>
                  )}
                  <ul>
                    {mainItem.submenuItems?.map((item, i) => (
                      <li key={i} className={item.submenu ? "submenu" : ""}>
                        <Link
                          href={item.link || "#"}
                          // className={`${pathname === item.link ? "active" : ""}`}
                          className={`
                            flex
                            items-center
                            gap-3
                            px-4
                            py-3
                            rounded-lg
                            mx-2
                            transition-colors
                            ${pathname === item.link ? "bg-blue-50 text-blue-600" : "hover:bg-gray-100"}
                          `}
                          onClick={() => toggleSidebar(item.label)}
                        >
                          <i className={`ti ti-${item.icon} me-2`} />
                          {/* <span>{item.label}</span> */}
                          {!collapsed && <span>{item.label}</span>}
                          {item.submenu && <span className="menu-arrow" />}
                        </Link>
                        {item.submenu && (
                          <ul
                            style={{
                              display:
                                subOpen === item.label ? "block" : "none",
                            }}
                          >
                            {item?.submenuItems?.map((sub, j) => (
                              <li key={j}>
                                <Link
                                  href={sub.link || "#"}
                                  className={`${pathname === sub.link ? "active" : ""}`}
                                  onClick={() => toggleSubSidebar(sub.label)}
                                >
                                  {sub.label}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      {/* </PerfectScrollbar> */}
    </div>
  );
}
