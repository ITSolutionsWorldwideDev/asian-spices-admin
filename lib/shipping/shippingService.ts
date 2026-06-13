// lib/shipping/shippingService.ts
import { getShippingProvider } from "./providerFactory";

export async function createShipmentForOrder(
  order: any,
  providerSlug: string,
  storeId?: string,
) {
  const provider = await getShippingProvider(providerSlug, storeId);

  // -----------------------------
  // CREATE SHIPMENT
  // -----------------------------

  const shipment = await provider.createShipment({
    orderId: order.id,
    to: {
      city: order.customer_city,
      postalCode: order.customer_postcode,
    },
    from: order.store_address, // adjust
    // parcels: order.shippingInput, // from UI
    parcels: order.parcels,
  });

  if (!shipment?.externalId) {
    throw new Error("Shipment creation failed: missing externalId");
  }

  // -----------------------------
  // GENERATE LABEL (optional)
  // -----------------------------
  let label: { url: string } | null = null;

  try {
    label = await provider.generateLabel(shipment.externalId);
  } catch (err) {
    console.warn("Label generation failed", err);
  }

  return {
    shipment,
    label,
  };
}