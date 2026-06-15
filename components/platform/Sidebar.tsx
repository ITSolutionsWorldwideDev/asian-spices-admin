// apps/admin/components/platform/Sidebar.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import PerfectScrollbar from "react-perfect-scrollbar";
import "react-perfect-scrollbar/dist/css/styles.css";
import { ChevronsLeft } from "react-feather";

const PLATFORM_MENU = [
  {
    label: "Main",
    submenuHdr: "Main",
    submenuItems: [
      {
        label: "Dashboard",
        icon: "layout-grid",
        link: "/platform/dashboard",
        submenu: false,
      },
    ],
  },

  {
    label: "System Activity",
    submenu: true,
    submenuHdr: "Activity",
    submenuItems: [
      {
        label: "Orders",
        icon: "receipt",
        link: "/platform/orders",
        submenu: false,
      },
    ],
  },

  {
    label: "Partner Stores",
    submenu: true,
    submenuHdr: "Partner Stores",
    submenuItems: [
      {
        label: "Partners",
        icon: "building-store",
        link: "/platform/partners",
        submenu: false,
      },
      {
        label: "Stores",
        icon: "building-store",
        link: "/platform/stores",
        submenu: false,
      },
    ],
  },

  {
    label: "Inventory",
    submenu: true,
    submenuHdr: "Inventory",
    submenuItems: [
      {
        label: "Category",
        link: "/category",
        icon: "list-details",
        submenu: false,
      },
      {
        label: "Sub Category",
        link: "/sub-categories",
        icon: "carousel-vertical",
        submenu: false,
      },
      { label: "Brands", link: "/brand", icon: "triangles", submenu: false },
      { label: "Products", link: "/products", icon: "box", submenu: false },
      {
        label: "Create Product",
        link: "/products/new",
        icon: "table-plus",
        submenu: false,
      },
      { label: "Media", link: "/media", icon: "table-plus", submenu: false },
    ],
  },

  {
    label: "Recipes",
    submenu: true,
    submenuHdr: "Recipes",
    submenuItems: [
      {
        label: "Recipe Categories",
        link: "/recipe-categories",
        icon: "list-details",
        submenu: false,
      },
      { label: "All Recipes", link: "/recipes", icon: "box", submenu: false },
      {
        label: "Recipe Tags",
        link: "/recipe-tags",
        icon: "box",
        submenu: false,
      },
      { label: "Analytics", link: "/analytics", icon: "box", submenu: false },
      {
        label: "Create Receipe",
        link: "/recipes/new",
        icon: "table-plus",
        submenu: false,
      },
    ],
  },

  {
    label: "Tax",
    submenu: true,
    submenuHdr: "Tax",
    submenuItems: [
      {
        label: "Tax",
        link: "/platform/tax-rules",
        icon: "currency",
        submenu: false,
      },
    ],
  },

  {
    label: "Shipping",
    submenu: true,
    submenuHdr: "Shipping",
    submenuItems: [
      {
        label: "Shipping",
        link: "/platform/shipping/providers",
        icon: "truck",
        submenu: false,
      },
      {
        label: "Shipping Methods",
        link: "/platform/shipping/methods",
        icon: "tag",
        submenu: false,
      },
    ],
  },

  {
    label: "Packaging",
    submenu: true,
    submenuHdr: "Packaging",
    submenuItems: [
      {
        label: "Types",
        link: "/platform/packaging/types",
        icon: "gift",
        submenu: false,
      },
      {
        label: "Ribbons",
        link: "/platform/packaging/ribbons",
        icon: "shield",
        submenu: false,
      },
      {
        label: "Addons",
        link: "/platform/packaging/addons",
        icon: "archive",
        submenu: false,
      },
      {
        label: "Inventory",
        link: "/platform/packaging/inventory",
        icon: "package",
        submenu: false,
      },
      {
        label: "Rules",
        link: "/platform/packaging/rules",
        icon: "archive",
        submenu: false,
      },
      {
        label: "Orders",
        link: "/platform/packaging/orders",
        icon: "receipt",
        submenu: false,
      },
    ],
  },
  {
    label: "Configuration",
    submenu: true,
    submenuHdr: "Configuration",
    submenuItems: [
      {
        label: "Currencies",
        icon: "currency-euro",
        link: "/platform/currencies",
        submenu: false,
      },
      {
        label: "Currency Rates",
        icon: "exchange",
        link: "/platform/currency-rates",
        submenu: false,
      },

      {
        label: "Billing",
        icon: "credit-card",
        link: "/platform/billing",
        submenu: false,
      },
      {
        label: "Users & Roles",
        icon: "users",
        link: "/platform/users",
        submenu: false,
      },
      {
        label: "Settings",
        icon: "settings-cog",
        link: "/platform/settings",
        submenu: false,
      },
    ],
  },
];

export default function PlatformSidebar() {
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
      className={`sidebar pb-28 ${toggle ? "" : "active"} ${expandMenus ? "expand-menu" : ""}`}
      onMouseOver={expandMenuOpen}
      onMouseLeave={expandMenuClose}
      id="sidebar"
    >
      <div className="sidebar-logo p-3 flex items-center justify-between">
        <Link href="/platform/dashboard" className="logo">
          <img src="/assets/img/logo.svg" alt="Logo" />
        </Link>
        <button onClick={handleSidebar}>
          <ChevronsLeft />
        </button>
      </div>
      <PerfectScrollbar>
        <div className="sidebar-inner slimscroll">
          <div id="sidebar-menu" className="sidebar-menu">
            <ul className="pb-8">
              {PLATFORM_MENU.map((mainItem, idx) => (
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

/* <PerfectScrollbar>
        <div className="sidebar-inner slimscroll">
          <div id="sidebar-menu" className="sidebar-menu">
            <ul>
              {PLATFORM_MENU.map((item) => (
                <li key={item.link} className={pathname.startsWith(item.link) ? "active" : ""}>
                  <Link href={item.link}>
                    <i className={`ti ti-${item.icon} me-2`} />
                    <span>{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </PerfectScrollbar> */
