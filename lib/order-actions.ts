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
  // one or more stores via the multi-store path (routing_status = 'split'),
  // which has no single current_store_id to reassign away from.
  if (!order.current_store_id) {
    let reason = "No store assigned yet";

    if (order.routing_status === "split") {
      const allocatedStoreNames: string[] = Array.from(
        new Set(
          (order.items || []).flatMap((item: any) =>
            (item.allocations || [])
              .map((a: any) => a.store_name)
              .filter(Boolean),
          ),
        ),
      );

      reason =
        allocatedStoreNames.length === 1
          ? `Assigned to ${allocatedStoreNames[0]} via the split path - see Order Items below`
          : allocatedStoreNames.length > 1
            ? `Split across ${allocatedStoreNames.length} stores - see Order Items below`
            : "Order is split across multiple stores - see Order Items below";
    }

    state.reassign = { disabled: true, reason };
  }

  return state;
};
