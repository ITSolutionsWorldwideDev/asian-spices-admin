// app/api/platform/shipping/providers/test-connection/route.ts

import { NextRequest, NextResponse } from "next/server";
import { testCheapCargoConnection } from "@/lib/shipping/providers/cheapcargo";

export async function POST(req: NextRequest) {
  try {
    const { slug, credentials } = await req.json();

    if (!slug) {
      return NextResponse.json(
        { success: false, error: "Missing provider slug" },
        { status: 400 }
      );
    }

    if (!credentials || typeof credentials !== "object") {
      return NextResponse.json(
        { success: false, error: "Missing credentials object" },
        { status: 400 }
      );
    }

    let result;

    switch (slug) {
      case "cheapcargo": {
        const { apiKey, email, password } = credentials;

        if (!apiKey || !email || !password) {
          return NextResponse.json(
            {
              success: false,
              error: "Missing apiKey, email or password",
            },
            { status: 400 }
          );
        }

        result = await testCheapCargoConnection({
          apiKey,
          email,
          password,
        });

        break;
      }

      default:
        return NextResponse.json(
          { success: false, error: "Unsupported provider" },
          { status: 400 }
        );
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("Test connection error:", err);

    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}
