// lib/order-actions.ts

export type OrderActionState = {
  reassign: { disabled: boolean; reason?: string };
  forceDefault: { disabled: boolean; reason?: string };
  cancel: { disabled: boolean; reason?: string };
};

export const getOrderActionState = (order: any): OrderActionState => {
  if (!order) {
    return {
      reassign: { disabled: true, reason: "Loading..." },
      forceDefault: { disabled: true, reason: "Loading..." },
      cancel: { disabled: true, reason: "Loading..." },
    };
  }

  const state: OrderActionState = {
    reassign: { disabled: false },
    forceDefault: { disabled: false },
    cancel: { disabled: false },
  };

  // console.log("order ==== ", order);

  // 🔴 Cancelled orders
  if (order.order_status === "cancelled") {
    return {
      reassign: { disabled: true, reason: "Order is cancelled" },
      forceDefault: { disabled: true, reason: "Order is cancelled" },
      cancel: { disabled: true, reason: "Already cancelled" },
    };
  }

  // 🔴 Fully fulfilled
  if (order.fulfillment_status === "fulfilled") {
    state.reassign = {
      disabled: true,
      reason: "Order already fulfilled",
    };
    state.forceDefault = {
      disabled: true,
      reason: "Order already fulfilled",
    };
  }

  // 🔴 Max rejection reached
  if (order.rejection_count >= 3) {
    state.reassign = {
      disabled: true,
      reason: "Max retries reached",
    };
  }

  // 🔴 No single store assigned - either genuinely unrouted, or split across
  // multiple stores (routing_status = 'split'), which has no single store to
  // reassign away from.
  if (!order.current_store_id) {
    state.reassign = {
      disabled: true,
      reason:
        order.routing_status === "split"
          ? "Order is split across multiple stores - see Order Items below"
          : "No store assigned yet",
    };
  }

  return state;
};
