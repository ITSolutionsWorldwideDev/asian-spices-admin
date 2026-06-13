// packages/shipping/providers/cheapcargo.ts
export class CheapCargoProvider {
  constructor(private config: any) {}

  async createShipment(order: any) {
    const res = await fetch("https://api.cheapcargo.dev/shipments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.config.api_key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        reference: order.id,
        address: order.shipping_address,
      }),
    });

    return res.json();
  }
}