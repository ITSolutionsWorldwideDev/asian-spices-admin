// app/(store)/customers/[customerId]/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import CustomerForm from "@/components/customers/CustomerForm";
import AddressManager from "@/components/customers/AddressManager";

/* 
export type CustomerType = "B2C" | "B2B";

export interface Customer {
  id: string;
  customer_type: CustomerType;
  company_name?: string | null;
  tax_id?: string | null;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  credit_limit?: number;
  payment_terms?: number;
  status?: string;
  total_orders?: number;
  total_spent?: number;
}*/
type CustomerType = "B2C" | "B2B";

type Customer = {
  id: string;
  customer_type: CustomerType;
  company_name?: string;
  tax_id?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  city: string;
  postcode: string;
  credit_limit?: number;
  payment_terms?: number;
  status: string;
  total_orders: number;
  total_spent: number;
};

type Address = {
  id: string;
  label: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state?: string;
  postal_code?: string;
  country: string;
  is_default: boolean;
};

type Order = {
  id: string;
  order_number: string;
  order_type: string;
  status: string;
  total_amount: number;
  created_at: string;
};

export default function CustomerDetailPage() {
  const { customerId } = useParams();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCustomer = async () => {
    setLoading(true);
    const res = await fetch(`/api/customers/${customerId}`);
    const data = await res.json();
    setCustomer(data.customer);
    setAddresses(data.addresses);
    setLoading(false);
  };

  const fetchOrders = async () => {
    const res = await fetch(`/api/customers/${customerId}/orders`);
    const data = await res.json();
    setOrders(data.items);
  };

  useEffect(() => {
    fetchCustomer();
    fetchOrders();
  }, [customerId]);

  if (loading) return <p className="p-6">Loading...</p>;
  if (!customer) return <p className="p-6">Customer not found</p>;

  return (
    <div className="page-wrapper2 ">
      <div className="content space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">
            {customer.first_name} {customer.last_name}
          </h2>

          <StatusToggle customer={customer} onUpdate={fetchCustomer} />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="card p-4">Orders: {customer.total_orders}</div>
          <div className="card p-4">
            Spent: €{Number(customer.total_spent)?.toFixed(2)}
          </div>
          <div className="card p-4">Status: {customer.status}</div>
        </div>

        {/* Edit Customer Form */}
        <div className="card p-4">
          <h4 className="font-semibold mb-3">Edit Customer</h4>
          <CustomerForm initialData={customer} onSaved={fetchCustomer} />
        </div>

        {/* Multi-Address Manager */}
        <div className="card p-4">
          <h4 className="font-semibold mb-3">Addresses</h4>
          <AddressManager
            customerId={customer.id}
            addresses={addresses}
            onUpdate={fetchCustomer}
          />
        </div>

        {/* Orders */}
        <div className="card p-4">
          <h4 className="font-semibold mb-3">Order History</h4>
          <table className="w-full border">
            <thead>
              <tr>
                <th>Order</th>
                <th>Date</th>
                <th>Status</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td>
                    <Link href={`/orders/${o.id}`}>
                      #{o.order_number}
                    </Link>
                  </td>
                  <td>{new Date(o.created_at).toLocaleDateString()}</td>
                  <td>{o.status}</td>
                  <td>€{Number(o.total_amount).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Status Toggle Component
function StatusToggle({
  customer,
  onUpdate,
}: {
  customer: Customer;
  onUpdate: () => void;
}) {
  const toggleStatus = async () => {
    const newStatus = customer.status === "ACTIVE" ? "BLOCKED" : "ACTIVE";
    await fetch(`/api/customers/${customer.id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status: newStatus }),
      headers: { "Content-Type": "application/json" },
    });
    onUpdate();
  };

  return (
    <button
      onClick={toggleStatus}
      className={`px-4 py-2 rounded text-white ${
        customer.status === "ACTIVE" ? "bg-red-500" : "bg-green-500"
      }`}
    >
      {customer.status === "ACTIVE" ? "Block" : "Unblock"}
    </button>
  );
}

