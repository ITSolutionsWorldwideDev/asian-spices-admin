// data/sidebar_data.tsx
// import { all_routes as route } from "./all_routes";

export interface SidebarSubItem {
  label: string;
  link: string;
  icon?: string;
  submenu?: boolean;
  submenuItems?: SidebarSubItem[];
}

export interface SidebarItem {
  label: string;
  icon?: string;
  link?: string;
  submenu?: boolean;
  submenuHdr?: string;
  submenuItems?: SidebarSubItem[];
}

export const SidebarData: SidebarItem[] = [
  {
    label: "Main",
    submenuHdr: "Main",
    submenuItems: [
      {
        label: "Dashboard",
        icon: "layout-grid",
        link: "/dashboard",
        submenu: false,
      },
    ],
  },
  {
    label: "Inventory",
    submenu: true,
    submenuHdr: "Inventory",
    submenuItems: [
      { label: "Products Catalog", link: "/products-catalog", icon: "box", submenu: false },
    ],
  },
  {
    label: "Sales",
    submenuHdr: "Sales",
    submenu: true,
    submenuItems: [
      { label: "Orders Queue", link: "/orders-queue", icon: "file-invoice", submenu: false },
      { label: "Orders", link: "/orders", icon: "file-invoice", submenu: false },
      { label: "Returns", link: "/returns", icon: "file-invoice", submenu: false },
      // { label: "Invoices", link: "/invoice", icon: "file-invoice", submenu: false },
    ],
  },

  {
    label: "Packaging",
    submenu: true,
    submenuHdr: "Packaging",
    submenuItems: [
      {
        label: "Stock",
        link: "/packaging/stock",
        icon: "gift",
        submenu: false,
      },
      {
        label: "Rules",
        link: "/packaging/rules",
        icon: "shield",
        submenu: false,
      },
      {
        label: "Adjustments",
        link: "/packaging/adjustments",
        icon: "archive",
        submenu: false,
      },
    ],
  },


  {
    label: "Content (CMS)",
    submenuHdr: "Content (CMS)",
    submenuItems: [
      { label: "Blog", link: "/blogs", icon: "wallpaper", submenu: false },
    ],
  },
  {
    label: "User Management",
    submenuHdr: "User Management",
    submenuItems: [
      { label: "Customers", link: "/customers", icon: "users-group", submenu: false },
      { label: "Users", link: "/users", icon: "shield-up", submenu: false },
      { label: "Roles & Permissions", link: "/settings/roles", icon: "shield-up", submenu: false },
      
    ],
  },
  {
    label: "Settings",
    submenuHdr: "Settings",
    submenuItems: [
      { label: "Store Settings", link: "/settings", icon: "settings", submenu: false },
      // { label: "Logout", link: "/signin", icon: "logout", submenu: false },
    ],
  },
];
