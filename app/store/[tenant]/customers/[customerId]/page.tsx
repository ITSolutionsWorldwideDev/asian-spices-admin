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

/* "use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Props = {
  initialData?: any;
};

type Customer = {
  id: string;
  customer_type: "B2C" | "B2B";
  company_name?: string;
  tax_id?: string;
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

type Address = {
  address_id: number;
  address_line1: string;
  city: string;
  country: string;
  is_default: boolean;
};

type Order = {
  id: string;
  order_number: string;
  order_type: string;
  total_amount: number;
  payment_status: string;
  fulfillment_status: string;
  created_at: string;
};

export default function CustomerDetailPage() {
  const { customerId } = useParams();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    fetch(`/api/customers/${customerId}`)
      .then((res) => res.json())
      .then((data) => {
        setCustomer(data.customer);
        setAddresses(data.addresses);
      });

    fetch(`/api/customers/${customerId}/orders`)
      .then((res) => res.json())
      .then((data) => setOrders(data.items));
  }, [customerId]);

  const router = useRouter();

  const [form, setForm] = useState({
    customer_type: initialData?.customer_type || "B2C",
    company_name: initialData?.company_name || "",
    tax_id: initialData?.tax_id || "",
    first_name: initialData?.first_name || "",
    last_name: initialData?.last_name || "",
    email: initialData?.email || "",
    phone: initialData?.phone || "",
    credit_limit: initialData?.credit_limit || 0,
    payment_terms: initialData?.payment_terms || 0,
    address: {
      label: "Home",
      address_line1: "",
      address_line2: "",
      city: "",
      state: "",
      postal_code: "",
      country: "",
    },
  });

  // const toggleStatus = async () => {
  //   const newStatus = customer?.status === "ACTIVE" ? "BLOCKED" : "ACTIVE";

  //   await fetch(`/api/customers/${customerId}/status`, {
  //     method: "PATCH",
  //     body: JSON.stringify({ status: newStatus }),
  //   });

  //   setCustomer({ ...customer!, status: newStatus });
  // };

  if (!customer) return <p className="p-6">Loading...</p>;

  return (
    <div className="page-wrapper2 p-6 space-y-6">
  
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">
          {customer.first_name} {customer.last_name}
        </h2>

        <button
          onClick={toggleStatus}
          className={`px-4 py-2 rounded text-white ${
            customer.status === "ACTIVE" ? "bg-red-500" : "bg-green-500"
          }`}
        >
          {customer.status === "ACTIVE" ? "Block" : "Unblock"}
        </button>
      </div>


      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4">Orders: {customer.total_orders}</div>
        <div className="card p-4">
          Spent: ${customer.total_spent.toFixed(2)}
        </div>
        
      </div>


      <div className="card p-4">
        <h4 className="font-semibold mb-3">Addresses</h4>
        {addresses.map((a) => (
          <p key={a.address_id}>
            {a.address_line1}, {a.city}, {a.country}
            {a.is_default && " (Default)"}
          </p>
        ))}
      </div>


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
                  <Link href={`/admin/orders/${o.id}`}>#{o.order_number}</Link>
                </td>
                <td>{new Date(o.created_at).toLocaleDateString()}</td>
                <td>{o.payment_status}</td>
                <td>${Number(o.total_amount).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
          <tbody>
            {orders.map(o => (
              <tr key={o.order_id}>
                <td>
                  <Link href={`/admin/orders/${o.order_id}`}>
                    #{o.order_id}
                  </Link>
                </td>
                <td>{new Date(o.order_date).toLocaleDateString()}</td>
                <td>{o.status}</td>
                <td>${o.total_amount.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
 */
