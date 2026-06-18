// lib/auth/permissions.ts
export const PERMISSIONS = {
  MANAGE_STORES: "manage_stores",
  MANAGE_PRODUCTS: "manage_products",
  VIEW_ORDERS: "view_orders",
  MANAGE_SETTINGS: "manage_settings"
} as const;

export type PermissionKey = typeof PERMISSIONS[keyof typeof PERMISSIONS];
