// apps/admin/lib/services/storeDashboard.ts

import { pool } from "@/core/db";
import { cache } from "react";

export const getStoreDashboardData = cache(async (storeId: string) => {
  const [
    productsRes,
    ordersRes,
    customersRes,
    usersRes,
    revenueRes,
    monthRevenueRes,
    todayOrdersRes,
    pendingOrdersRes,
    recentOrdersRes,
  ] = await Promise.all([
    pool.query(`SELECT COUNT(*) FROM store_product_catalog WHERE store_id = $1`, [storeId]),

    pool.query(`SELECT COUNT(*) FROM store_orders WHERE store_id = $1`, [storeId]),

    pool.query(`SELECT COUNT(*) FROM store_customers WHERE store_id = $1`, [storeId]),

    pool.query(`SELECT COUNT(*) FROM store_users WHERE store_id = $1`, [
      storeId,
    ]),

    pool.query(
      `SELECT COALESCE(SUM(total_amount),0) AS total
       FROM store_orders
       WHERE store_id = $1 AND order_status = 'completed'`,
      [storeId],
    ),

    pool.query(
      `SELECT COALESCE(SUM(total_amount),0) AS total
       FROM store_orders
       WHERE store_id = $1
         AND order_status = 'completed'
         AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW())`,
      [storeId],
    ),

    pool.query(
      `SELECT COUNT(*)
       FROM store_orders
       WHERE store_id IS NULL
         AND DATE(created_at) = CURRENT_DATE`,
      [],
    ),

    pool.query(
      `SELECT COUNT(*)
       FROM store_orders
       WHERE store_id = $1
         AND order_status = 'pending'`,
      [storeId],
    ),

    pool.query(
      `SELECT id, total_amount, order_status, created_at
       FROM store_orders
       WHERE store_id = $1
       ORDER BY created_at DESC
       LIMIT 5`,
      [storeId],
    ),
  ]);

  return {
    totalProducts: Number(productsRes.rows[0].count),
    totalOrders: Number(ordersRes.rows[0].count),
    totalCustomers: Number(customersRes.rows[0].count),
    totalUsers: Number(usersRes.rows[0].count),

    totalRevenue: Number(revenueRes.rows[0].total),
    monthRevenue: Number(monthRevenueRes.rows[0].total),
    todayOrders: Number(todayOrdersRes.rows[0].count),
    pendingOrders: Number(pendingOrdersRes.rows[0].count),

    recentOrders: recentOrdersRes.rows,
  };
});
