// apps/admin/components/sidebar.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import PerfectScrollbar from "react-perfect-scrollbar";
import "react-perfect-scrollbar/dist/css/styles.css";
import { SidebarData } from "@/data/sidebar_data";
import { ChevronsLeft } from "react-feather";

export default function Sidebar() {
  const pathname = usePathname();
  const [subOpen, setSubOpen] = useState("");
  const [subSidebar, setSubSidebar] = useState("");
  const [toggle, setToggle] = useState(false);
  const [expandMenus, setExpandMenus] = useState(false);

  const toggleSidebar = (title: string) => {
    setSubOpen(subOpen === title ? "" : title);
  };

  const toggleSubSidebar = (title: string) => {
    setSubSidebar(subSidebar === title ? "" : title);
  };

  const handleSidebar = () => {
    document.body.classList.toggle("mini-sidebar");
    setToggle(!toggle);
  };

  const expandMenuOpen = () => {
    setExpandMenus(true);
    document.body.classList.add("expand-menu");
  };

  const expandMenuClose = () => {
    setExpandMenus(false);
    document.body.classList.remove("expand-menu");
  };

  useEffect(() => {
    document.body.classList.toggle("expand-menu", expandMenus);
  }, [expandMenus]);

  return (
    <div
      className={`sidebar ${toggle ? "" : "active"} ${expandMenus ? "expand-menu" : ""}`}
      onMouseOver={expandMenuOpen}
      onMouseLeave={expandMenuClose}
    >
      <div className="sidebar-logo p-3">
        <Link href="/" className="logo">
          <img src="assets/img/logo.svg" alt="Logo" />
        </Link>
        <button id="toggle_btn" onClick={handleSidebar}>
          <ChevronsLeft />
        </button>
      </div>
      <PerfectScrollbar>
        <div className="sidebar-inner slimscroll">
          <div id="sidebar-menu" className="sidebar-menu">
            <ul>
              {SidebarData.map((mainItem, idx) => (
                <li key={idx} className="submenu-open">
                  <h6 className="submenu-hdr">{mainItem.submenuHdr}</h6>
                  <ul>
                    {mainItem.submenuItems?.map((item, i) => (
                      <li key={i} className={item.submenu ? "submenu" : ""}>
                        <Link
                          href={item.link || "#"}
                          className={`${pathname === item.link ? "active" : ""}`}
                          onClick={() => toggleSidebar(item.label)}
                        >
                          <i className={`ti ti-${item.icon} me-2`} />
                          <span>{item.label}</span>
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
      </PerfectScrollbar>
    </div>
  );
}
