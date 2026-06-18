// apps/admin/app/(store)/[tenant]/dashboard/page.tsx

import { requireStoreAccess } from "@/lib/auth/guards";
import { getStoreDashboardData } from "@/lib/services/storeDashboard";

export const revalidate = 60;

export default async function StoreDashboard({ 
  params 
}: { 
  params: Promise<{ tenant: string }> 
}) {
  
  const { tenant } = await params;

  const store = await requireStoreAccess(tenant);
  // console.log('session store details === ',store);

  const {
    totalProducts,
    totalOrders,
    totalCustomers,
    totalUsers,
    totalRevenue,
    monthRevenue,
    todayOrders,
    pendingOrders,
    recentOrders,
  } = await getStoreDashboardData(store.id);

  return (
    <div className="page-wrapper2 p-6">
      <div className="content space-y-6">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-gray-800">
            Store Dashboard - {store.name}
          </h1>
          <p className="text-gray-500">
            Overview of your store performance and activity
          </p>
        </div>

        {/* Revenue KPI */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-primary text-white rounded-lg p-4 shadow">
            <h6 className="text-sm font-medium">Total Revenue</h6>
            <h3 className="text-2xl font-bold">€{totalRevenue.toLocaleString()}</h3>
          </div>

          <div className="bg-white rounded-lg p-4 shadow">
            <h6 className="text-sm font-medium text-gray-600">This Month Revenue</h6>
            <h3 className="text-2xl font-bold">€{monthRevenue.toLocaleString()}</h3>
          </div>

          <div className="bg-white rounded-lg p-4 shadow">
            <h6 className="text-sm font-medium text-gray-600">Orders Today</h6>
            <h3 className="text-2xl font-bold">{todayOrders}</h3>
          </div>

          <div className="bg-white rounded-lg p-4 shadow">
            <h6 className="text-sm font-medium text-gray-600">Pending Orders</h6>
            <h3 className="text-2xl font-bold">{pendingOrders}</h3>
          </div>
        </div>

        {/* Operational Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 shadow">
            <h6 className="text-sm font-medium text-gray-600">Total Products</h6>
            <h3 className="text-2xl font-bold">{totalProducts}</h3>
          </div>

          <div className="bg-white rounded-lg p-4 shadow">
            <h6 className="text-sm font-medium text-gray-600">Total Orders</h6>
            <h3 className="text-2xl font-bold">{totalOrders}</h3>
          </div>

          {/* <div className="bg-white rounded-lg p-4 shadow">
            <h6 className="text-sm font-medium text-gray-600">Total Customers</h6>
            <h3 className="text-2xl font-bold">{totalCustomers}</h3>
          </div> */}

          <div className="bg-white rounded-lg p-4 shadow">
            <h6 className="text-sm font-medium text-gray-600">Store Staff</h6>
            <h3 className="text-2xl font-bold">{totalUsers}</h3>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-4 shadow h-full flex flex-col justify-between">
            <div>
              <h5 className="text-lg font-medium text-gray-700">Manage Products</h5>
              <p className="text-gray-500 mt-1">Add, update, and manage store inventory.</p>
            </div>
            <a
              href="/products-catalog"
              className="mt-4 inline-block bg-primary text-white px-4 py-2 rounded hover:bg-blue-700 transition"
            >
              Go to Products
            </a>
          </div>

          <div className="bg-white rounded-lg p-4 shadow h-full flex flex-col justify-between">
            <div>
              <h5 className="text-lg font-medium text-gray-700">Manage Orders</h5>
              <p className="text-gray-500 mt-1">View and process customer orders.</p>
            </div>
            <a
              href="/orders"
              className="mt-4 inline-block bg-primary text-white px-4 py-2 rounded hover:bg-blue-700 transition"
            >
              View Orders
            </a>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <h5 className="text-lg font-medium text-gray-700">Recent Orders</h5>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left table-auto">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-gray-600">ID</th>
                  <th className="px-4 py-2 text-gray-600">Amount</th>
                  <th className="px-4 py-2 text-gray-600">Status</th>
                  <th className="px-4 py-2 text-gray-600">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order: any,index) => (
                  <tr key={order.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2">#{order.order_number}</td>
                    <td className="px-4 py-2">€{Number(order.total_amount).toLocaleString()}</td>
                    <td className="px-4 py-2">{order.order_status}</td>
                    <td className="px-4 py-2">{new Date(order.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
