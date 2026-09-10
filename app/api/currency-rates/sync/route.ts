// app/api/currency-rates/sync/route.ts

import { NextResponse } from "next/server";
import { pool } from "@/core/db";

const BASE_CURRENCY = "EUR";

type ExternalRatesResponse = {
  base?: string;
  rates?: Record<string, number>;
};

export async function POST() {
  try {
    const { rows: currencies } = await pool.query<{
      id: string;
      code: string;
    }>(`SELECT id, code FROM currencies WHERE is_active = true`);

    if (!currencies.length) {
      return NextResponse.json(
        { error: "No currencies found. Add currencies first." },
        { status: 400 },
      );
    }

    const base = currencies.find((c) => c.code === BASE_CURRENCY);
    if (!base) {
      return NextResponse.json(
        { error: `${BASE_CURRENCY} not found in currencies table` },
        { status: 400 },
      );
    }

    const targets = currencies.filter((c) => c.code !== BASE_CURRENCY);
    if (!targets.length) {
      return NextResponse.json(
        { error: "No target currencies to sync" },
        { status: 400 },
      );
    }

    // Free public API (no key) — EUR base rates for a wide set of currencies
    const apiUrl = `https://open.er-api.com/v6/latest/${BASE_CURRENCY}`;

    const apiRes = await fetch(apiUrl, { cache: "no-store" });
    if (!apiRes.ok) {
      return NextResponse.json(
        { error: "Failed to fetch rates from external API" },
        { status: 502 },
      );
    }

    const data = (await apiRes.json()) as ExternalRatesResponse & {
      result?: string;
    };
    if (data.result && data.result !== "success") {
      return NextResponse.json(
        { error: "External rate API returned an error" },
        { status: 502 },
      );
    }
    const rates = data.rates || {};

    let saved = 0;
    const skipped: string[] = [];

    for (const target of targets) {
      const rate = rates[target.code];
      if (rate == null || !Number.isFinite(rate)) {
        skipped.push(target.code);
        continue;
      }

      await pool.query(
        `
        INSERT INTO currency_rates (base_currency_id, target_currency_id, rate)
        VALUES ($1, $2, $3)
        ON CONFLICT (base_currency_id, target_currency_id)
        DO UPDATE SET rate = EXCLUDED.rate, updated_at = NOW()
        `,
        [base.id, target.id, rate],
      );
      saved += 1;
    }

    return NextResponse.json({
      success: true,
      base: BASE_CURRENCY,
      saved,
      skipped,
    });
  } catch (err) {
    console.error("POST currency-rates sync error:", err);
    return NextResponse.json(
      { error: "Failed to sync currency rates" },
      { status: 500 },
    );
  }
}
