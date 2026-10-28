// components/StoreOrderFulfillment.tsx

"use client";

import { useState } from "react";

export default function StoreOrderFulfillment({
  order,
  onSubmit,
}: {
  order: any;
  onSubmit: (items: any[]) => void;
}) {
  const [itemsState, setItemsState] = useState(
    order.items.map((item: any) => ({
      item_id: item.id,
      fulfill: item.remaining_quantity || item.quantity,
    })),
  );

  const updateQty = (itemId: string, value: number) => {
    setItemsState((prev: any[]) =>
      prev.map((i) => (i.item_id === itemId ? { ...i, fulfill: value } : i)),
    );
  };

  return (
    <div className="space-y-4">
      {order.items.map((item: any) => {
        const remaining = item.quantity - (item.fulfilled_quantity || 0);

        return (
          <div key={item.id} className="border p-4 rounded bg-white">
            {/* 🔥 HEADER */}
            <div className="flex justify-between">
              <div>
                <p className="font-semibold">{item.product_name}</p>
                <p className="text-sm text-gray-500">Remaining: {remaining}</p>
              </div>

              {/* 🔥 INPUT */}
              <input
                type="number"
                min={0}
                max={remaining}
                value={
                  itemsState.find((i: any) => i.item_id === item.id)?.fulfill ||
                  0
                }
                onChange={(e) => updateQty(item.id, Number(e.target.value))}
                className="border px-2 py-1 w-20"
              />
            </div>

            {/* 🔥 OTHER STORE ALLOCATIONS */}
            <div className="mt-3 space-y-1 text-sm">
              {item.allocations.map((a: any, idx: number) => (
                <div
                  key={idx}
                  className="flex justify-between bg-gray-50 px-2 py-1 rounded"
                >
                  <span>{a.store_name}</span>
                  <span>
                    {a.fulfilled_quantity}/{a.allocated_quantity}
                    <span className="ml-2 text-xs text-gray-500">
                      ({a.status})
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* 🔥 ACTION */}
      <button
        onClick={() => onSubmit(itemsState)}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        Submit Partial Fulfillment
      </button>
    </div>
  );
}
