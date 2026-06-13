// apps/components/orders-queue/ordersQueueList.tsx

"use client";

import { useEffect, useState } from "react";
import Table from "@/core/common/pagination/datatable";
import { all_routes } from "@/data/all_routes";

import Link from "next/link";
import { Eye } from "react-feather";
import FilterBar from "./FilterBar";
import { useToast } from "@/core/ui";

type Order = {
  order_id: string;
  order_number: string;
  city: string;
  order_date: string;
  items_count: number;
  total_amount: number;
  payment_status: string;
};

type Filters = {
  search?: string;
  customer?: string;
  product?: string;
  status?: string;
  sort?: string;
};

export default function OrdersQueueListComponent() {
  const route = all_routes;

  const [orders, setOrders] = useState<Order[]>([]);
  const [filters, setFilters] = useState<Filters>({});
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const fetchOrders = async (appliedFilters = filters) => {
    try {
      setLoading(true);

      const params = new URLSearchParams(
        Object.entries(appliedFilters).filter(([_, v]) => v) as any,
      );

      const res = await fetch(`/api/orders-queue?${params.toString()}`);
      const data = await res.json();

      setOrders(data.items || []);
    } catch (err) {
      showToast("error", "Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const columns = [
    {
      title: "Order",
      dataIndex: "order_number",
      render: (num: string) => <strong>#{num}</strong>,
    },
    {
      title: "Date",
      dataIndex: "order_date",
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    { title: "City", dataIndex: "city" },
    { title: "Items", dataIndex: "items_count" },
    {
      title: "Total",
      dataIndex: "local_allocated_value",
      render: (v: number) => `€${v}`,
    },
    {
      title: "Order Status",
      dataIndex: "order_status",
      render: (s: string) => <span className={`badge badge-${s}`}>{s}</span>,
    },
    // {
    //   title: "Status",
    //   dataIndex: "status",
    //   render: (s: string) => (
    //     <span className={`badge badge-${s.toLowerCase()}`}>{s}</span>
    //   ),
    // },
    {
      title: "Action",
      render: (_: any, record: Order) => (
        <Link href={`/orders-queue/${record.order_id}`}>
          <Eye size={16} />
        </Link>
      ),
    },
  ];

  return (
    <>
      <div className="pt-0 page-wrapper2">
        <div className="content">
          <div className="page-header flex flex-wrap justify-between items-center gap-3 mb-4">
            <div>
              <h4 className="text-lg font-semibold">Orders Queue List</h4>
              <p>Pending Acceptance</p>
            </div>
          </div>

          <div className="card table-list-card mb-4">
            <div className="card-header flex flex-wrap justify-between items-center gap-3">
              <FilterBar
                onApply={(newFilters) => {
                  setFilters(newFilters);
                  fetchOrders(newFilters);
                }}
              />
            </div>

            <div className="card-body">
              <div className="overflow-x-auto">
                {loading ? (
                <div className="flex items-center justify-center py-24 space-x-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black" />
                  <p className="text-gray-500 font-medium">Loading...</p>
                </div>
                ) : (
                  <Table
                    columns={columns}
                    dataSource={orders}
                    rowKey="order_id"
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
