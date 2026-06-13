// apps/admin/lib/shipping/adapters/types.ts (Not in use)

/* export interface ShipmentInput {
  orderId: string;
  to: any;
  from: any;
  parcel: any;
}

export interface Rate {
  service: string;
  price: number;
  currency: string;
  estimatedDays?: number;
}

export interface ShipmentResult {
  externalId: string;
  trackingNumber?: string;
  labelUrl?: string;
  raw: any;
}

export interface ShippingAdapter {
  createShipment(input: ShipmentInput): Promise<ShipmentResult>;
  getRates(input: ShipmentInput): Promise<Rate[]>;
  generateLabel(externalId: string): Promise<{ url: string }>;
} */

/* export interface ShipmentInput {
  orderId: string;
  to: {
    name: string;
    address: string;
    city: string;
    country: string;
    postalCode: string;
  };
  from: {
    name: string;
    address: string;
    city: string;
    country: string;
    postalCode: string;
  };
  parcel: {
    weight: number;
    length?: number;
    width?: number;
    height?: number;
  };
}

export interface Rate {
  service: string;
  price: number;
  currency: string;
  estimatedDays?: number;
}

export interface ShipmentResult {
  externalId: string;
  trackingNumber?: string;
  labelUrl?: string;
  raw: any;
}

export interface ShippingAdapter {
  createShipment(input: ShipmentInput): Promise<ShipmentResult>;
  getRates(input: ShipmentInput): Promise<Rate[]>;
  generateLabel(externalId: string): Promise<string>;
} */