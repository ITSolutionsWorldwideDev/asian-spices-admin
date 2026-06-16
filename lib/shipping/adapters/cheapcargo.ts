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

  private getStandardizedTimestamp(): string {
    const now = new Date();

    const formatter = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Amsterdam",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      hour12: false,
    });

    const parts = formatter.formatToParts(now);

    const getPart = (type: string) =>
      parts.find((p) => p.type === type)?.value ?? "";

    const YYYY = getPart("year");
    const MM = getPart("month");
    const DD = getPart("day");

    const hour = parseInt(getPart("hour"), 10);
    const roundedHour = Math.floor(hour / 2) * 2;
    const HH = String(roundedHour).padStart(2, "0");

    return `${YYYY}${MM}${DD}${HH}`;
  }

  private getAuthenticationToken() {
    // const timestamp = this.getStandardizedTimestamp(false);
    const timestamp = this.getStandardizedTimestamp();
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

    const parseStreetNumber = (street: string, incomingNum: string) => {
      if (incomingNum && !incomingNum.toLowerCase().includes("line")) {
        return incomingNum;
      }
      const match = street.match(/\s+(\d+[a-zA-Z]?)$/);
      return match ? match[1] : "1";
    };

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
            // "@pay": true,
            // "@waitForLabel": true,
            "@id": input.orderId,
            "@orderBy": "price",
            sender: {
              companyName: input.from.name || "Store Vendor Instance",
              contactPerson: "Store Administrator",
              street: input.from.street || "Hoofdstraat",
              number: parseStreetNumber(
                input.from.street || "",
                input.from.number || "123",
              ),
              zipcode: (input.from.postal_code || "1000AA").replace(/\s+/g, ""),
              city: input.from.city || "Amsterdam",
              country: input.from.country || "NL",
              phone: input.from.phone || "+31612345678",
              email:
                input.from.email || this.creds.email || "sender@example.com",
              type: "business",
            },
            receiver: {
              companyName: input.to.companyName || "Private Customer Consignee",
              contactPerson: input.to.contactPerson || "Jane Receiver",
              street: input.to.street || "Kerkstraat",
              number: parseStreetNumber(
                input.to.street || "",
                input.to.number || "456",
              ),
              zipcode: (input.to.postal_code || "2000BB").replace(/\s+/g, ""),
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
                value: Math.round(150 / Math.max(1, parcelList.length)),
                // value: Math.round((input.totalValue || 150) / Math.max(1, parcelList.length)),
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
          "User-Agent": "EcommerceApp/1.0 NextJS-ShippingAdapter",
          // 🚀 Inject standard User-Agent so Nginx doesn't classify Next.js fetch as a suspicious bot script
          // "User-Agent":
          //   "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 AcmeShippingApp/1.0",
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

      const shipped_data = await res.json();

      console.log("shipment shipped_data === ", shipped_data);
      console.log("shipment shipped_data.shipment === ", shipped_data.shipment);

      if (shipped_data?.shipment?.status !== "ok") {
        const problemArr =
          shipped_data?.shipment?.order?.[0]?.details?.problems?.problem;
        const reason = problemArr
          ? JSON.stringify(problemArr)
          : "Unknown operational reason";
        throw new Error(`CheapCargo shipment rejected: ${reason}`);
      }

      console.log(
        "shipment shipped_data.shipment?.order === ",
        shipped_data.shipment?.order,
      );

      const shipped_order = shipped_data?.shipment?.order?.[0];

      if (!shipped_order) {
        console.error("Invalid CheapCargo response:", shipped_data);
        throw new Error("Invalid CheapCargo response");
      }

      const externalId = shipped_order.number;
      const trackingNumber = shipped_order.details?.awb || undefined;
      const trackingUrl = shipped_order.details?.trackAndTrace || undefined;

      const paymentUrl = shipped_data?.shipment?.url || undefined;

      console.log("externalId === ", externalId);
      console.log("trackingNumber === ", trackingNumber);
      console.log("trackingUrl === ", trackingUrl);

      return {
        externalId: externalId,
        trackingNumber: trackingNumber,
        trackingUrl: trackingUrl,
        labelUrl: undefined,
        paymentUrl: paymentUrl,
        raw: shipped_data,
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
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "User-Agent": "EcommerceApp/1.0 NextJS-ShippingAdapter",
        // 🚀 Inject standard User-Agent so Nginx doesn't classify Next.js fetch as a suspicious bot script
        // "User-Agent":
        //   "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 AcmeShippingApp/1.0",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    console.log(
      "CheapCargo trackShipment raw response:",
      JSON.stringify(data, null, 2),
    );

    // if (data?.shipments?.status === "error") {
    //   throw new Error(
    //     `CheapCargo tracking failed: ${JSON.stringify(data.shipments.error)}`,
    //   );
    // }

    if (data?.status?.status === "error") {
      throw new Error(
        `CheapCargo tracking failed: ${JSON.stringify(data.status.error || data)}`,
      );
    }

    // 📝 Extract tracking details array based on document specs: status -> label
    const trackingLabel = data?.status?.label?.[0];
    const details = trackingLabel?.details;

    // Map trackAndTrace history statuses safely if available
    const statusArray = details?.trackAndTrace?.statuses?.status || [];
    const latestTransitEvent = statusArray[statusArray.length - 1];

    return {
      statusName: details?.status || "Unknown", // Returns e.g. "booked", "inTransit", "delivered"
      paid: trackingLabel?.paid || false,
      awb: details?.awb || undefined,
      trackingUrl: details?.trackAndTrace?.url || undefined,
      latestTransitMessage: latestTransitEvent?.message || undefined,
      latestTransitOccurred: latestTransitEvent?.occurred || undefined,
      raw: data,
    };

    // const trackingInfo = data?.shipments?.status?.[0];

    // return {
    //   statusName: trackingInfo?.statusName || "Unknown",
    //   StatusCode: trackingInfo?.StatusCode || "0",
    //   raw: data,
    // };
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

    console.log(
      "generateLabel to CheapCargo:",
      JSON.stringify(payload, null, 2),
    );

    const res = await fetch(`${this.baseUrl}/getLabel`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "User-Agent": "EcommerceApp/1.0 NextJS-ShippingAdapter",
        // 🚀 Inject standard User-Agent so Nginx doesn't classify Next.js fetch as a suspicious bot script
        // "User-Agent":
        //   "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 AcmeShippingApp/1.0",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    // 🔥 ENHANCED LOGGING: Stringifies the nested error array returned from the gateway
    console.log(
      "generateLabel CheapCargo raw getLabel payload stringified response:",
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
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "User-Agent": "EcommerceApp/1.0 NextJS-ShippingAdapter",
        // 🚀 Inject standard User-Agent so Nginx doesn't classify Next.js fetch as a suspicious bot script
        // "User-Agent":
        //   "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 AcmeShippingApp/1.0",
      },
      body: JSON.stringify(payload),
    });

    return res.json();
  }
}

/**
 * ⏱ Helper to compute standardized 2-hour server time-blocks
 * Aligned completely to local system timezone parameters
 */

/* private getStandardizedTimestamp(useUTC = false): string {
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
  } */
