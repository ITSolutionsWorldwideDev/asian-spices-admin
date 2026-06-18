// app/platform/orders/[orderId]/OrderDetailsClient.tsx

"use client";

import { useEffect, useState } from "react";
import OrderTimeline from "@/components/platform/orders/OrderTimeline";
import { CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import OrderCountdown from "@/components/store/OrderCountdown";

import SmartActionButton from "@/components/SmartActionButton";
import { getOrderActionState } from "@/lib/order-actions";

import { useToast } from "@/core/ui";
import LoaderOverlay from "@/components/loader-overlay";
import StoreOrderFulfillment from "@/components/StoreOrderFulfillment";

export default function OrderDetailsClient({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingOverlay, setLoadingOverlay] = useState(false);

  const { showToast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    setLoadingOverlay(true);

    const [orderRes, eventsRes] = await Promise.all([
      fetch(`/api/platform/orders/${orderId}`),
      fetch(`/api/orders/${orderId}/events`),
    ]);

    const orderData = await orderRes.json();
    const eventsData = await eventsRes.json();

    setOrder(orderData.order);
    setEvents(eventsData.events);

    setLoading(false);
    setLoadingOverlay(false);
  };

  useEffect(() => {
    fetchData();
  }, [orderId]);

  const actionState = getOrderActionState(order ?? null);

  const action = async (type: string) => {
    // setLoading(true);
    setLoadingOverlay(true);

    try {
      const res = await fetch(`/api/orders/${orderId}/action`, {
        method: "POST",
        body: JSON.stringify({ action: type }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Action failed");
      }

      fetchData();
    } catch (err: any) {
      showToast("error", err.message);
    } finally {
      //   setLoading(false);

      setLoadingOverlay(false);
    }
  };

  <LoaderOverlay show={loadingOverlay} message="Saving store settings..." />;
  if (loading) return <p className="p-6">Loading...</p>;

  return (
    <div className="page-wrapper">
      <div className="content p-6 mb-6">
        {/* 🔥 HEADER */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Order #{order?.order_number}</h1>
            <p className="text-gray-500">
              Placed on {new Date(order.created_at).toLocaleString()}
            </p>
            <p className="text-gray-500">
              Deadline {new Date(order.deadline).toLocaleString()}
            </p>
          </div>

          {actionState.reassign.disabled && actionState.reassign.reason && (
            <div className="bg-yellow-50 border border-yellow-300 text-yellow-800 px-4 py-2 rounded mb-4">
              ⚠ {actionState.reassign.reason}
            </div>
          )}

          <div className="flex gap-2">
            <SmartActionButton
              label="Reassign"
              onClick={() => action("reassign")}
              disabled={actionState.reassign.disabled}
              reason={actionState.reassign.reason}
              color="blue"
            />

            <SmartActionButton
              label="Default Store"
              onClick={() => action("force_default")}
              disabled={actionState.forceDefault.disabled}
              reason={actionState.forceDefault.reason}
              color="yellow"
            />

            <SmartActionButton
              label="Cancel Order"
              onClick={() => action("cancel")}
              disabled={actionState.cancel.disabled}
              reason={actionState.cancel.reason}
              color="red"
            />
          </div>

          {/* <div className="flex gap-2">
            <button
              onClick={() => action("reassign")}
              className="bg-blue-500 text-white px-3 py-1 rounded"
            >
              Reassign
            </button>

            <button
              onClick={() => action("force_default")}
              className="bg-yellow-500 text-white px-3 py-1 rounded"
            >
              Default Store
            </button>

            <button
              onClick={() => action("cancel")}
              className="bg-red-500 text-white px-3 py-1 rounded"
            >
              Cancel
            </button>
          </div> */}
        </div>

        {/* 🔥 ORDER SUMMARY */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded shadow">
            <h3 className="font-semibold mb-2">Status</h3>
            <p className="font-semibold">{order?.order_status}</p>
          </div>

          <div className="bg-white p-4 rounded shadow">
            <h3 className="font-semibold mb-2">Store</h3>
            <p className="font-semibold">{order?.store_name || "-"}</p>
          </div>

          <div className="bg-white p-4 rounded shadow">
            <h3 className="font-semibold mb-2">Rejections</h3>
            <p className="font-semibold">{order?.rejection_count}</p>
          </div>
        </div>

        {/* 🔥 CUSTOMER + ADDRESS */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white p-4 rounded shadow">
            <h3 className="font-semibold mb-2">Customer</h3>
            <span className="text-sm text-gray-500 flex">{order.customer_name}</span>
            <span className="text-sm text-gray-500 flex">{order.email}</span>
            <span className="text-sm text-gray-500 flex">{order.phone}</span>
          </div>

          <div className="bg-white p-4 rounded shadow">
            <h3 className="font-semibold mb-2">Shipping Address</h3>
            <span className="text-sm text-gray-500 flex">{order.shipping_address_line1}</span>
            <span className="text-sm text-gray-500 flex">{order.shipping_address_line2}</span>
            <span className="text-sm text-gray-500 flex">
              {order.shipping_postal_code}, {order.shipping_city}, {order.shipping_state}, {order.shipping_country}
            </span>
          </div>
        </div>

        {/* 🔥 ORDER ITEMS */}

        <div className="bg-white rounded shadow mb-6 p-4">
          <h2 className="font-semibold mb-4">Order Items</h2>

          {order.items.map((item: any) => (
            <div key={item.id} className="border-b py-3">
              <div className="flex justify-between">
                <div>
                  <p className="font-medium">{item.product_name}</p>
                  <p className="text-sm text-gray-500">
                    {item.fulfilled_quantity} / {item.quantity} fulfilled
                  </p>
                </div>
              </div>

              {/* 🔥 STORE BREAKDOWN */}
              <div className="mt-2 space-y-2">
                {(item.allocations || []).map((a: any, i: number) => (
                  <div
                    key={i}
                    className="flex justify-between items-center text-sm bg-gray-50 px-3 py-2 rounded"
                  >
                    {/* STORE NAME */}
                    <div>
                      <p className="font-medium">
                        {a.store_name || a.store_id}
                      </p>
                      <p className="text-xs text-gray-500">
                        {a.fulfilled_quantity} / {a.allocated_quantity}{" "}
                        fulfilled
                      </p>
                    </div>

                    {/* STATUS BADGE */}
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadge(
                        a.status,
                      )}`}
                    >
                      {getStatusIcon(a.status)}
                      {a.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <StoreOrderFulfillment
          order={order}
          onSubmit={(items) =>
            fetch(`/api/orders/${order.id}/allocate`, {
              method: "POST",
              body: JSON.stringify({
                action: "partial",
                items,
              }),
            })
          }
        />

        {/* 🔥 TIMELINE */}
        <OrderTimeline events={events} />

        <OrderCountdown deadline={order.deadline} />
      </div>
    </div>
  );
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case "fulfilled":
      return <CheckCircle size={14} />;
    case "partial":
      return <AlertTriangle size={14} />;
    case "rejected":
      return <XCircle size={14} />;
    default:
      return null;
  }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "fulfilled":
      return "bg-green-100 text-green-700";
    case "partial":
      return "bg-yellow-100 text-yellow-700";
    case "rejected":
      return "bg-red-100 text-red-700";
    case "assigned":
      return "bg-blue-100 text-blue-700";
    default:
      return "bg-gray-100 text-gray-600";
  }
};

{
  /* <div className="bg-white rounded shadow mb-6">
          <table className="w-full">
            <thead className="bg-gray-100 text-sm">
              <tr>
                <th className="p-3 text-left">Product</th>
                <th>Qty</th>
                <th>Fulfilled</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {order.items.map((item: any) => (
                <tr key={item.id} className="border-t">
                  <td className="p-3">{item.product_name}</td>
                  <td>{item.quantity}</td>
                  <td>{item.fulfilled_quantity}</td>
                  <td>{item.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div> */
}
