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

  const status = String(order.order_status || "").toLowerCase();
  const routingStatus = String(order.routing_status || "").toLowerCase();

  // 🔴 Cancelled orders
  if (status === "cancelled" || routingStatus === "cancelled") {
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

  // 🔴 No single store assigned
  if (!order.current_store_id) {
    const allocatedStoreNames: string[] = Array.from(
      new Set(
        (order.items || []).flatMap((item: any) =>
          (item.allocations || [])
            .map((a: any) => a.store_name)
            .filter(Boolean),
        ),
      ),
    );

    // Old split rows that only landed on one store are treated as assigned
    if (
      order.routing_status === "split" &&
      allocatedStoreNames.length === 1
    ) {
      // keep reassign disabled only if truly unassigned elsewhere
    } else if (order.routing_status === "split") {
      state.reassign = {
        disabled: true,
        reason:
          allocatedStoreNames.length > 1
            ? `Split across ${allocatedStoreNames.length} stores - see Order Items below`
            : "No store assigned yet",
      };
    } else {
      state.reassign = {
        disabled: true,
        reason: "No store assigned yet",
      };
    }
  }

  return state;
};
