// // apps/admin/lib/services/platformDashboard.ts

import { pool } from "@/core/db";
import { cache } from "react";

export const getPlatformDashboardData = cache(async () => {
  const [
    storesRes,
    activeStoresRes,
    usersRes,
    revenueRes,
    subscriptionsRes,

    // 🔥 PARTNERS
    partnersTotalRes,
    partnersPendingRes,
  ] = await Promise.all([
    // Total stores
    pool.query(`SELECT COUNT(*) FROM stores`),

    // Active stores
    pool.query(
      `SELECT COUNT(*) FROM stores WHERE status = 'active'`
    ),

    // Platform users
    pool.query(`SELECT COUNT(*) FROM users`),

    // Revenue (from subscriptions or orders)
    pool.query(
      `SELECT COALESCE(SUM(price_cents),0) AS total
       FROM plans`
    ),

    // Active subscriptions
    pool.query(
      `SELECT COUNT(*) FROM subscriptions WHERE status = 'active'`
    ),

    // ✅ Partner stats
    pool.query(`SELECT COUNT(*) FROM partner_registration`),

    pool.query(
      `SELECT COUNT(*) FROM partner_registration WHERE status = 'pending'`
    ),
  ]);

  return {
    totalStores: Number(storesRes.rows[0].count),
    activeStores: Number(activeStoresRes.rows[0].count),
    totalUsers: Number(usersRes.rows[0].count),

    totalRevenue: Number(revenueRes.rows[0].total),
    activeSubscriptions: Number(subscriptionsRes.rows[0].count),

    // 🔥 Partners
    totalPartners: Number(partnersTotalRes.rows[0].count),
    pendingPartners: Number(partnersPendingRes.rows[0].count),
  };
});