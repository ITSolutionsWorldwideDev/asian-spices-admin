// app/store/[tenant]/orders-queue/[orderId]/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ChevronLeft,
  Package,
  User,
  CreditCard,
  Printer,
  Truck,
} from "react-feather";
import { useToast } from "@/core/ui";
import Link from "next/link";

type OrderItem = {
  order_item_id: string;
  product_id: string;
  name: string;
  sku: string;
  quantity: number;
  fulfilled_quantity: number;
  available_stock?: number;
  price: number;
};

type OrderDetail = {
  id: string;
  order_number: string;
  order_date: string;
  order_status: string;
  payment_status: string;
  fulfillment_status: string;
  total_amount: string | number;
  subtotal: string | number;
  tax_amount: string | number;
  shipping_amount: string | number;
  customer_city: string;
  customer_state: string;
  customer_country: string;
  customer_postcode: string;
  tracking_number: string;
  shipping_label: string;
  order_type: "B2C" | "B2B";
  items: OrderItem[];
};

// const SHIPPING_STATUSES = [
//   "pending",
//   "processing",
//   "shipped",
//   "out_for_delivery",
//   "delivered",
//   "cancelled",
// ];

export default function OrderDetailPage() {
  const { tenant, orderId } = useParams();
  // const { orderId } = useParams();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const router = useRouter();

  const [shippingStatus, setShippingStatus] = useState("");

  useEffect(() => {
    if (order?.fulfillment_status) {
      setShippingStatus(order.fulfillment_status);
    }
  }, [order]);

  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/orders-queue/${orderId}`);
        if (!res.ok) throw new Error("Order not found");
        const data = await res.json();
        
        setOrder(data.order);
      } catch (err: any) {
        showToast("error", err.message || "Could not load order details");
      } finally {
        setLoading(false);
      }
    };

    if (orderId) fetchOrder();
  }, [orderId, showToast]);

  if (loading) 
    return <div className="p-10 text-center text-sm font-medium">Loading Order Details...</div>;
  
  if (!order) 
    return <div className="p-10 text-center text-red-500 font-medium">Order not found</div>;

  const total = Number(order.total_amount);
  const isQueuePending = order.order_status === "pending";

  /*
  const canEditAllocation = order.order_status === "pending";

  const isFullPossible = order.items.every(
    (i) => (i.available_stock ?? 0) >= i.quantity,
  );

  const hasPartialQty = order.items.some(
    (i) => (i.fulfilled_quantity ?? 0) > 0,
  );

  // ================= HELPERS =================
  const updateQty = (itemId: string, value: string) => {
    if (!order) return;

    const qty = parseInt(value || "0", 10);

    setOrder((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        items: prev.items.map((item) =>
          item.order_item_id === itemId
            ? {
                ...item,
                fulfilled_quantity: Math.max(
                  0,
                  Math.min(qty, item.quantity, item.available_stock ?? 0),
                ),
              }
            : item,
        ),
      };
    });
  };

  // ================= DECISION =================
  const handleDecision = async (action: "full" | "partial" | "reject") => {
    try {
      setLoading(true);

      const payload: any = { action };

      // PARTIAL
      if (action === "partial") {
        payload.items = order.items.map((item) => ({
          item_id: item.order_item_id,
          fulfilled_quantity: item.fulfilled_quantity ?? 0, // default partial
        }));
      }

      // FULL
      if (action === "full") {
        payload.items = order.items.map((item) => ({
          item_id: item.order_item_id,
          fulfilled_quantity: item.quantity,
        }));
      }

      // fulfilled_quantity: item.available_stock ?? 0, // default partial
      const res = await fetch(`/api/orders/${orderId}/allocate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      showToast("success", "Decision applied");

      // redirect to main orders page
      window.location.href = "/orders";
    } catch (err: any) {
      showToast("error", err.message);
    } finally {
      setLoading(false);
    }
  };
  */

  const isEligibleToAccept = order.items.every(
    (item) => (item.available_stock ?? 0) >= item.quantity
  );

  const handleQueueAction = async (action: "accept" | "reject") => {
    try {
      setLoading(true);

      const res = await fetch(`/api/orders/${orderId}/allocate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action execution error");

      showToast("success", action === "accept" ? "Order accepted!" : "Order rejected and re-routed.");
      
      // Return back to the dashboard queue processing index view
      router.push(`/store/${tenant}/orders-queue`);
    } catch (err: any) {
      showToast("error", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper2 max-w-7xl mx-auto p-6">
      <div className="content space-y-6">
        
        {/* Navigation Action Header bar */}
        <div className="flex items-center justify-between bg-white border p-4 rounded-xl shadow-sm">
          <Link
            href={`/store/${tenant}/orders-queue`}
            className="flex items-center text-sm font-medium text-gray-600 hover:text-black transition"
          >
            <ChevronLeft size={16} className="mr-1" /> Back to Queue List
          </Link>

          <div className="flex gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${order.payment_status === "paid" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
              {order.payment_status}
            </span>
            <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-semibold uppercase">
              {order.order_type}
            </span>
          </div>
        </div>

        {/* Dynamic Queue Action Hero Grid component summary row */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-gray-50 p-6 border rounded-xl gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Process Order #{order.order_number}</h2>
            <p className="text-sm text-gray-500">Route Requested: {new Date(order.order_date).toLocaleString()}</p>
          </div>

          {isQueuePending && (
            <div className="flex items-center gap-3">
              <button
                disabled={!isEligibleToAccept || loading}
                onClick={() => handleQueueAction("accept")}
                className="px-5 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl shadow transition duration-150 cursor-pointer"
              >
                Accept Order
              </button>
              <button
                disabled={loading}
                onClick={() => handleQueueAction("reject")}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-xl shadow transition duration-150 cursor-pointer"
              >
                Reject & Re-route
              </button>
            </div>
          )}
        </div>

        {/* Logistics Information Container block elements */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border rounded-xl shadow-sm p-5">
            <div className="flex items-center gap-2 mb-3 text-gray-700 border-b pb-2">
              <User size={16} />
              <h4 className="font-bold text-xs uppercase tracking-wider text-gray-400">Target Shipping Region</h4>
            </div>
            <p className="text-sm text-gray-800 font-medium">City Location: {order.customer_city}, {order.customer_state} {order.customer_country}</p>
            <p className="text-sm text-gray-800 font-medium">Postal Address Area: {order.customer_postcode}</p>
          </div>

          <div className="bg-white border rounded-xl shadow-sm p-5">
            <div className="flex items-center gap-2 mb-3 text-gray-700 border-b pb-2">
              <CreditCard size={16} />
              <h4 className="font-bold text-xs uppercase tracking-wider text-gray-400">Capture Information Summary</h4>
            </div>
            <p className="text-sm text-gray-800">Payment Status: <strong className="uppercase font-semibold">{order.payment_status}</strong></p>
            {!isEligibleToAccept && isQueuePending && (
              <p className="text-xs text-red-500 mt-1 font-semibold">
                ⚠️ Warning: Order contains line items that exceed your current catalog quantities.
              </p>
            )}
          </div>
        </div>

        {/* Simplified Item Table View Frame */}
        <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b bg-gray-50 flex items-center gap-2">
            <Package size={16} className="text-gray-400" />
            <h4 className="font-semibold text-gray-700 text-sm">Line Items Overview</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="text-xs font-semibold text-gray-500 uppercase bg-gray-50 border-b">
                  <th className="p-4">Product Name</th>
                  <th className="p-4 text-center">SKU</th>
                  {/* <th className="p-4 text-center">Catalog Stock</th> */}
                  <th className="p-4 text-center">Qty Demanded</th>
                  <th className="p-4 text-right">Price</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {order.items.map((item) => {
                  const hasStock = (item.available_stock ?? 0) >= item.quantity;
                  return (
                    <tr key={item.order_item_id} className="hover:bg-gray-50/50 transition">
                      <td className="p-4 font-medium text-gray-900">{item.name}</td>
                      <td className="p-4 text-center text-gray-500 font-mono text-xs">{item.sku}</td>
                      {/* <td className="p-4 text-center">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${hasStock ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                          {item.available_stock ?? 0} In Stock
                        </span>
                      </td> */}
                      <td className="p-4 text-center font-bold text-gray-900">{item.quantity}</td>
                      <td className="p-4 text-right font-semibold text-gray-900">€{(item.price * item.quantity).toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Ledger Totals */}
        <div className="bg-white border rounded-xl shadow-sm p-5 ml-auto max-w-xs space-y-2 text-sm">
          <div className="flex justify-between text-gray-500">
            <span>Subtotal</span>
            <span>€{Number(order.subtotal).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-gray-500">
            <span>Tax</span>
            <span>€{Number(order.tax_amount).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-gray-500 border-b pb-2">
            <span>Shipping Cost</span>
            <span>€{Number(order.shipping_amount).toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold text-gray-900 text-base pt-1">
            <span>Gross Total</span>
            <span>€{total.toFixed(2)}</span>
          </div>
        </div>

      </div>
    </div>
  );

} 