// lib/shipping/providers/cheapcargo.ts

import crypto from "crypto";
import { withRetry } from "@/lib/utils/retry";
import md5 from "md5";

const BASE_URL =
  process.env.IS_CHEAPCARGO_SANDBOX === "true"
    ? "https://www.cheapcargo-demo.nl/api/rateRequest"
    : "https://www.cheapcargo.com/api/rateRequest";


type Credentials = {
  apiKey: string;
  email: string;
  password: string;
};

// -----------------------------
// Helpers
// -----------------------------

function getStandardizedTimestamp(): string {
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

function getAuthenticationToken(apiKey: any) {
  const timestamp = getStandardizedTimestamp();
  return md5(apiKey + timestamp);
}

function getPasswordHash(value: string) {
  return md5(value);
}

// -----------------------------
// TEST CONNECTION (ONLY FUNCTION YOU NEED HERE)
// -----------------------------
export async function testCheapCargoConnection(creds: Credentials) {
  try {

    const authentication = getAuthenticationToken(creds.apiKey);
    const passwordHash =  getPasswordHash(creds.password.trim()); //"34dbe7e451f2d0b166a292ce0021599d";

    const payload = {
      shipments: {
        authentication: authentication,
        version: "2.1",
        user: {
          email: creds.email,
          password: passwordHash,
        },
        shipment: [
          {
            "@orderBy": "price",
            sender: {
              zipcode: "3011 TA",
              city: "Amsterdam",
              country: "NL",
              type: "business",
            },
            receiver: {
              zipcode: "1511 AN",
              city: "Oostzaan",
              country: "NL",
              type: "business",
            },
            content: {
              colli: [
                {
                  description: "Test package",
                  weight: 1,
                  length: 10,
                  width: 10,
                  height: 10,
                  value: 10,
                  package: "PACKAGE",
                  quantity: 1,
                },
              ],
            },
            incoterm: "DAP",
          },
        ],
      },
    };

    const res = await fetch(BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    console.log("CheapCargo test:", {
      // timestamp,
      authentication,
      response: data,
    });

    // API error
    if (data?.rates?.status === "error") {
      return {
        success: false,
        error: data?.rates?.error?.[0]?.message || "Authentication failed",
        details: data,
      };
    }

    if (!res.ok) {
      return {
        success: false,
        error: "Request failed",
        details: data,
      };
    }

    return { success: true };
  } catch (err: any) {
    return {
      success: false,
      error: "Unable to reach provider API",
      details: err?.message,
    };
  }
}
