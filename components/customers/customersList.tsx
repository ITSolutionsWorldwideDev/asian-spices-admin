// components/customers/CustomersList.tsx
"use client";

import { useEffect, useState } from "react";
import Table from "@/core/common/pagination/datatable";
import Link from "next/link";
import { Eye } from "react-feather";
import CustomerFilterBar from "./CustomerFilterBar";
import { useToast } from "@/core/ui";

type Customer = {
  id: string;
  customer_type: "B2C" | "B2B";
  company_name?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  credit_limit: number;
  payment_terms: number;
  total_orders: number;
  total_spent: number;
  created_at: string;
};

type Filters = {
  search?: string;
  customer_type?: string;
  sort?: string;
};

export default function CustomersListComponent() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const fetchCustomers = async (filters: Filters = {}) => {
    try {
      setLoading(true);

      const params = new URLSearchParams(
        Object.entries(filters).filter(([_, v]) => v) as any,
      );

      const res = await fetch(`/api/customers?${params.toString()}`);
      const data = await res.json();

      setCustomers(data.items || []);
    } catch {
      showToast("error", "Failed to load customers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const columns = [
    {
      title: "Customer",
      render: (_: any, r: Customer) =>
        r.customer_type === "B2B"
          ? r.company_name
          : `${r.first_name} ${r.last_name ?? ""}`,
    },
    { title: "Type", dataIndex: "customer_type" },
    { title: "Email", dataIndex: "email" },
    { title: "Phone", dataIndex: "phone" },
    {
      title: "Credit Limit",
      render: (_: any, r: Customer) =>
        r.customer_type === "B2B"
          ? `€${Number(r.credit_limit).toFixed(2)}`
          : "-",
    },
    {
      title: "Orders",
      dataIndex: "total_orders",
    },
    {
      title: "Spent",
      dataIndex: "total_spent",
      render: (v: number) => `€${Number(v).toFixed(2)}`,
    },
    {
      title: "Action",
      render: (_: any, r: Customer) => (
        <Link href={`/customers/${r.id}`}>
          <Eye size={16} />
        </Link>
      ),
    },
  ];

  /* const columns = [
    {
      title: "Customer",
      render: (_: any, r: Customer) =>
        `${r.first_name} ${r.last_name ?? ""}`,
    },
    { title: "Email", dataIndex: "email" },
    { title: "Phone", dataIndex: "phone" },
    { title: "Orders", dataIndex: "total_orders" },
    {
      title: "Spent",
      dataIndex: "total_spent",
      render: (v: number) => `€${v.toFixed(2)}`,
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (s: string) => (
        <span className={`badge badge-${s.toLowerCase()}`}>
          {s}
        </span>
      ),
    },
    {
      title: "Action",
      render: (_: any, r: Customer) => (
        <Link href={`/admin/customers/${r.customer_id}`}>
          <Eye size={16} />
        </Link>
      ),
    },
  ]; */

  return (
    <div className="page-wrapper2">
      <div className="content">
        <div className="page-header mb-4">
          <h4 className="text-lg font-semibold">Store Customers</h4>
          <p className="text-gray-500">Customers registered on your store</p>
        </div>

        <div className="card table-list-card">
          <div className="card-header flex flex-wrap justify-between items-center gap-3">
            <CustomerFilterBar onApply={fetchCustomers} />
          </div>

          <div className="card-body">
            {loading ? (
              <div className="flex items-center justify-center py-24 space-x-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black" />
                <p className="text-gray-500 font-medium">Loading...</p>
              </div>
            ) : (
              <Table columns={columns} dataSource={customers} rowKey="id" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
