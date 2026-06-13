// apps/admin/lib/shipping/adapters/CheapCargoAdapter.ts (Not in use)
/* 
import {
  ShipmentInput,
  ShipmentResult,
  Rate,
  ShippingAdapter,
} from "./types";

export class CheapCargoAdapter implements ShippingAdapter {
  private apiKey: string;
  private apiSecret: string;
  private baseUrl: string;

  constructor(config: {
    apiKey: string;
    apiSecret: string;
    baseUrl: string;
  }) {
    this.apiKey = config.apiKey;
    this.apiSecret = config.apiSecret;
    this.baseUrl = config.baseUrl;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const res = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`, // adjust if needed
        ...options.headers,
      },
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("CheapCargo API error:", data);
      throw new Error("CheapCargo API failed");
    }

    return data;
  }

  // =========================
  // CREATE SHIPMENT
  // =========================
  async createShipment(input: ShipmentInput): Promise<ShipmentResult> {
    const payload = {
      shipment: {
        reference: input.orderId,

        shipper: input.from,
        recipient: input.to,

        parcel: input.parcel,
      },
    };

    const data = await this.request("/shipments", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    return {
      externalId: data.id,
      trackingNumber: data.tracking_number,
      labelUrl: data.label_url,
      raw: data,
    };
  }

  // =========================
  // GET RATES
  // =========================
  async getRates(input: ShipmentInput): Promise<Rate[]> {
    const payload = {
      from: input.from,
      to: input.to,
      parcel: input.parcel,
    };

    const data = await this.request("/rates", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    return (data.rates || []).map((r: any) => ({
      service: r.service_name,
      price: r.price,
      currency: r.currency || "EUR",
      estimatedDays: r.estimated_days,
    }));
  }

  // =========================
  // GENERATE LABEL
  // =========================
  async generateLabel(externalId: string): Promise<string> {
    const data = await this.request(`/shipments/${externalId}/label`, {
      method: "GET",
    });

    return data.label_url;
  }
} */