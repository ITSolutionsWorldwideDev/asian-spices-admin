// lib/shipping/adapters/cheapcargo.ts

import md5 from "md5";

import {
  ShippingAdapter,
  ShipmentInput,
  ShipmentResult,
  LabelResult,
} from "../types";

type Credentials = {
  apiKey: string;
  email: string;
  password: string;
  sandbox?: boolean;
};

export class CheapCargoAdapter implements ShippingAdapter {
  private baseUrl: string;

  constructor(private creds: Credentials) {
    console.log("creds ==== ", creds);

    this.baseUrl = creds.sandbox
      ? "https://www.cheapcargo-demo.nl/api"
      : "https://www.cheapcargo.com/api";
  }
  /**
   * ⏱ Helper to compute standardized 2-hour server time-blocks
   * Aligned completely to local system timezone parameters
   */

  private getStandardizedTimestamp(useUTC = false): string {
    const now = new Date();

    const hour = useUTC ? now.getUTCHours() : now.getHours();
    const roundedHour = Math.floor(hour / 2) * 2;

    const YYYY = useUTC ? now.getUTCFullYear() : now.getFullYear();
    const MM = String(
      (useUTC ? now.getUTCMonth() : now.getMonth()) + 1,
    ).padStart(2, "0");
    const DD = String(useUTC ? now.getUTCDate() : now.getDate()).padStart(
      2,
      "0",
    );
    const HH = String(roundedHour).padStart(2, "0");

    return `${YYYY}${MM}${DD}${HH}`;
  }

  private getAuthenticationToken() {

    console.log('this.creds.apiKey ==== ',this.creds.apiKey);
    const timestamp = this.getStandardizedTimestamp(false);

    console.log('timestamp ==== ',timestamp);
    return md5(this.creds.apiKey.trim() + timestamp);
  }

  private getPasswordHash() {
    return md5(this.creds.password);
  }

  // ======================================================
  // 🔹 RATE REQUEST
  // ======================================================
  async getRates(input: ShipmentInput): Promise<any> {
    const parcelList = Array.isArray(input.parcels) ? input.parcels : [];

    const payload = {
      shipments: {
        authentication: this.getAuthenticationToken(),
        version: "2.0",
        user: {
          email: this.creds.email,
          password: this.getPasswordHash(),
        },
        shipment: [
          {
            "@orderBy": "price",
            sender: {
              zipcode: input.from.postal_code,
              city: input.from.city,
              country: input.from.country || "NL",
              type: "business",
            },
            receiver: {
              zipcode: input.to.postal_code,
              city: input.to.city,
              country: input.to.country || "NL",
              type: "business",
            },
            content: {
              colli: parcelList.map((parcel: any, idx: number) => ({
                description: `Order shipment item component #${idx + 1}`,
                weight: Number(parcel.weight),
                length: Number(parcel.length || 10),
                width: Number(parcel.width || 10),
                height: Number(parcel.height || 10),
                value: 100,
                package: "PACKAGE",
                quantity: 1, // Handled individually as explicit elements inside the list array wrapper
              })),
              // colli: [
              //   {
              //     description: "Order shipment",
              //     weight: Number(input.parcel.weight),
              //     length: Number(input.parcel.length || 0),
              //     width: Number(input.parcel.width || 0),
              //     height: Number(input.parcel.height || 0),
              //     value: 100,
              //     package: "PACKAGE",
              //     quantity: Number(input.parcel.boxes || 1),
              //   },
              // ],
            },
            incoterm: "DAP",
          },
        ],
      },
    };

    const res = await fetch(`${this.baseUrl}/rateRequest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    return data;
  }

  // ======================================================
  // 🔹 CREATE SHIPMENT
  // ======================================================
  async createShipment(input: ShipmentInput): Promise<ShipmentResult> {
    console.log("createShipment API input === ", input);

    const parcelList = Array.isArray(input.parcels) ? input.parcels : [];

    const payload = {
      shipments: {
        authentication: this.getAuthenticationToken(),
        version: "2.1",
        user: {
          email: this.creds.email,
          password: this.getPasswordHash(),
        },
        shipment: [
          {
            "@pay": false,
            "@waitForLabel": false,
            "@id": input.orderId,
            "@orderBy": "price",
            sender: {
              companyName: input.from.name || "Store Vendor Instance",
              contactPerson: "Store Administrator",
              street: input.from.street || "Hoofdstraat",
              number: input.from.number || "123",
              zipcode: input.from.postal_code || "1000AA",
              city: input.from.city || "Amsterdam",
              country: input.from.country || "NL",
              phone: input.from.phone || "+31612345678",
              email: input.from.email || "sender@example.com",
              type: "business",
            },
            receiver: {
              companyName: input.to.companyName || "Private Customer Consignee",
              contactPerson: input.to.contactPerson || "Jane Receiver",
              street: input.to.street || "Kerkstraat",
              number: input.to.number || "456",
              zipcode: input.to.postal_code || "2000BB",
              city: input.to.city || "Rotterdam",
              country: input.to.country || "NL",
              phone: input.to.phone || "+31687654321",
              email: input.to.email || "receiver@example.com",
              type: "business",
            },
            content: {
              colli: parcelList.map((parcel: any, idx: number) => ({
                description: `Order package item element box #${idx + 1}`,
                weight: Number(parcel.weight) || 1.0,
                length: Number(parcel.length || 10),
                width: Number(parcel.width || 10),
                height: Number(parcel.height || 10),
                value: Math.round(150 / Math.max(1, parcelList.length)), // Safely split total custom declared value
                package: "PACKAGE",
                quantity: 1,
              })),
              // colli: [
              //   {
              //     description: "Order package",
              //     weight: Number(input.parcel.weight) || 2.5,
              //     length: Number(input.parcel.length || 0),
              //     width: Number(input.parcel.width || 0),
              //     height: Number(input.parcel.height || 0),
              //     value: 150,
              //     package: "PACKAGE",
              //     quantity: Number(input.parcel.boxes || 1),
              //   },
              // ],
            },
            reference: input.orderId,
          },
        ],
      },
    };

    console.log(
      "Submitting stringified payload data mapping to CheapCargo:",
      JSON.stringify(payload, null, 2),
    );

    // console.log(
    //   "createShipment API payload shipments === ",
    //   payload?.shipments?.shipment,
    // );
    console.log(
      "createShipment sender zipcode === ",
      payload?.shipments?.shipment[0]?.sender.zipcode,
    );
    console.log(
      "createShipment receiver zipcode === ",
      payload?.shipments?.shipment[0]?.receiver.zipcode,
    );
    console.log(
      "createShipment API URL === ",
      `${this.baseUrl}/createShipment`,
    );

    try {
      const res = await fetch(`${this.baseUrl}/createShipment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          // 🚀 Inject standard User-Agent so Nginx doesn't classify Next.js fetch as a suspicious bot script
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 AcmeShippingApp/1.0",
        },
        // headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      // 🚀 DEFENSIVE CHECK: If response is not OK (e.g. 400, 500 HTML error), capture text instead of crashing JSON parser
      if (!res.ok) {
        const errorText = await res.text();
        console.error(`CheapCargo HTTP Error (${res.status}):`, errorText);
        throw new Error(
          `CheapCargo gateway returned HTTP status ${res.status}. Check your server log output.`,
        );
      }

      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        const textData = await res.text();
        console.error(
          "Expected JSON but received raw response content:",
          textData,
        );
        throw new Error(
          "CheapCargo API did not return valid JSON. See logs for HTML error context.",
        );
      }

      const data = await res.json();

      console.log("shipment data === ", data);
      console.log("shipment data.shipment === ", data.shipment);

      if (data?.shipment?.status !== "ok") {
        console.log("shipment data.shipment?.error === ", data.shipment?.error);
        console.error("CheapCargo error:", data);
        throw new Error("CheapCargo shipment failed");
      }
      console.log("shipment data.shipment?.order === ", data.shipment?.order);

      const order = data?.shipment?.order?.[0];

      if (!order) {
        console.error("Invalid CheapCargo response:", data);
        throw new Error("Invalid CheapCargo response");
      }

      const externalId = order.number;
      const trackingNumber = order.details?.awb || undefined;
      const trackingUrl = order.details?.trackAndTrace || undefined;

      console.log("externalId === ", externalId);
      console.log("trackingNumber === ", trackingNumber);
      console.log("trackingUrl === ", trackingUrl);

      return {
        externalId: externalId,
        trackingNumber: trackingNumber,
        trackingUrl: trackingUrl,
        labelUrl: undefined,
        raw: data,
      };
    } catch (error: any) {
      console.log("createShipment api error =======  ", error);
    }

    return {
      externalId: "",
      trackingNumber: "",
      trackingUrl: "",
      labelUrl: undefined,
      raw: "",
    };
  }

  // ======================================================
  // 🔹 TRACK SHIPMENT
  // ======================================================
  async trackShipment(orderNumber: string): Promise<any> {
    const payload = {
      shipments: {
        authentication: this.getAuthenticationToken(),
        version: "2.1",
        user: {
          email: this.creds.email,
          password: this.getPasswordHash(),
        },
        status: [
          {
            orderNumber,
          },
        ],
      },
    };

    const res = await fetch(`${this.baseUrl}/getStatus`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    console.log(
      "CheapCargo trackShipment raw response:",
      JSON.stringify(data, null, 2),
    );

    if (data?.shipments?.status === "error") {
      throw new Error(
        `CheapCargo tracking failed: ${JSON.stringify(data.shipments.error)}`,
      );
    }

    const trackingInfo = data?.shipments?.status?.[0];

    return {
      statusName: trackingInfo?.statusName || "Unknown",
      StatusCode: trackingInfo?.StatusCode || "0",
      raw: data,
    };

    return res.json();
  }

  // ======================================================
  // 🔹 GENERATE LABEL
  // ======================================================
  async generateLabel(orderNumber: string): Promise<LabelResult> {
    // const staticPasswordHash = md5(this.creds.password);

    const payload = {
      labels: {
        authentication: this.getAuthenticationToken(),
        version: "2.1",
        user: {
          email: this.creds.email,
          password: this.getPasswordHash(),
        },
        label: [
          {
            orderNumber: orderNumber,
            type: "pdf",
          },
        ],
      },
    };

    const res = await fetch(`${this.baseUrl}/getLabel`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    // 🔥 ENHANCED LOGGING: Stringifies the nested error array returned from the gateway
    console.log(
      "CheapCargo raw getLabel payload stringified response:",
      JSON.stringify(data, null, 2),
    );

    // Handle errors using any root wrapper variant safely
    if (data?.labels?.status === "error") {
      const errorDetails = JSON.stringify(data?.labels?.error || data, null, 2);
      throw new Error(
        `CheapCargo label creation rejected by gateway: ${errorDetails}`,
      );
    }

    const labelObject = data?.labels?.label?.[0];
    const url = labelObject?.url || labelObject?.file;

    if (!url) {
      throw new Error(
        "Label data verified but download target URL location returned empty",
      );
    }

    return { url };
  }

  // ======================================================
  // 🔹 CANCEL SHIPMENT
  // ======================================================
  async cancelShipment(orderId: string, orderNumber: string): Promise<any> {
    const payload = {
      shipments: {
        authentication: this.getAuthenticationToken(),
        version: "2.1",
        user: {
          email: this.creds.email,
          password: this.getPasswordHash(),
        },
        order: [
          {
            "@id": orderId,
            orderNumber,
          },
        ],
      },
    };

    const res = await fetch(`${this.baseUrl}/cancelShipment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    return res.json();
  }
}
