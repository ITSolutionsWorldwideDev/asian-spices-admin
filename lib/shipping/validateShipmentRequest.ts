// apps/admin/lib/shipping/validateShipmentRequest.ts

export function validateShipmentRequest({
  order,
  method,
  parcels,
}: {
  order: any;
  method: any;
  parcels: any;
}) {
  // --------------------
  // Order validation
  // --------------------
  if (!order) throw new Error("Order not found");
  if (order.fulfillment_status === "shipped") throw new Error("Order already shipped");
  if (order.order_status === "cancelled") throw new Error("Cannot ship cancelled order");
  if (!order.items || order.items.length === 0) throw new Error("Order has no items");

  // --------------------
  // Shipping method validation
  // --------------------
  if (!method) throw new Error("Shipping method not found");
  if (!method.provider_id) throw new Error("Shipping method is not API-enabled");

  console.log('parcel ==== ',parcels);

  // --------------------
  // Array Parcel validation 🚀
  // --------------------
  if (!Array.isArray(parcels) || parcels.length === 0) {
    throw new Error("Parcels parameter must be a non-empty array");
  }

  const validateDim = (val: any, name: string, index: number) => {
    if (val !== undefined && val !== "" && (isNaN(Number(val)) || Number(val) <= 0)) {
      throw new Error(`Box #${index + 1} has an invalid ${name}`);
    }
  };

  parcels.forEach((parcel, idx) => {
    const weight = Number(parcel?.weight);
    if (!weight || weight <= 0) {
      throw new Error(`Box #${idx + 1} has an invalid weight (must be greater than 0)`);
    }

    validateDim(parcel?.length, "length", idx);
    validateDim(parcel?.width, "width", idx);
    validateDim(parcel?.height, "height", idx);
  });

  // --------------------
  // Parcel validation
  // --------------------
  /* const weight = Number(parcels?.weight);

  if (!weight || weight <= 0) {
    throw new Error("Invalid parcel weight");
  }

  const boxes = Number(parcels?.boxes ?? 1);

  if (boxes <= 0) {
    throw new Error("Invalid number of boxes");
  }

  // optional dimensions validation
  const validateDim = (val: any, name: string) => {
    if (val !== undefined && val !== "" && isNaN(Number(val))) {
      throw new Error(`Invalid ${name}`);
    }
  };

    // console.log('validateDim ==== ',validateDim);

  validateDim(parcels?.length, "length");
  validateDim(parcels?.width, "width");
  validateDim(parcels?.height, "height"); */

  return true;
}