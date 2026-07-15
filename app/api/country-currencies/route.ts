// app/api/country-currencies/route.ts


import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/core/db";

// ----------------- GET: Fetch countries (with joined currency data) -----------------

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const shippableOnly = searchParams.get("shippable") === "true";

    // Select SQL fields and map them directly inside the query or via the wrapper
    let query = `
      SELECT 
        c.country_id, 
        c.country_name, 
        c.country_code, 
        c.currency_code AS fallback_code,
        c.is_shippable,
        c.currency_id,
        cur.code AS mapped_currency_code,
        cur.name AS mapped_currency_name
      FROM public.countries c
      LEFT JOIN public.currencies cur ON c.currency_id = cur.id
    `;

    const values: any[] = [];

    if (shippableOnly) {
      query += ` WHERE c.is_shippable = true`;
    }

    query += ` ORDER BY c.country_name ASC`;

    const result = await pool.query(query, values);

    // Map rows to the precise object structure expected by the frontend component
    const formattedCountries = result.rows.map((row) => ({
      country_id: row.country_id,
      country_name: row.country_name,
      country_code: row.country_code,
      currency_id: row.currency_id,
      currency_code: row.mapped_currency_code || row.fallback_code || "",
      currency_name: row.mapped_currency_name || null,
    }));

    // Wrap the array in an object matching `data.items`
    return NextResponse.json({ items: formattedCountries });
  } catch (err) {
    console.error("Error fetching countries:", err);
    return NextResponse.json(
      { error: "Failed to fetch countries" },
      { status: 500 },
    );
  }
}

// ----------------- PUT: Update a country's mapped currency -----------------
export async function PUT(req: NextRequest) {
  try {
    const { country_id, currency_id } = await req.json();

    if (!country_id) {
      return NextResponse.json(
        { error: "Country ID is required" },
        { status: 400 },
      );
    }

    // Update the currency mapping for the selected country
    const { rows } = await pool.query(
      `
      UPDATE public.countries
      SET currency_id = $1
      WHERE country_id = $2
      RETURNING *
      `,
      [currency_id || null, country_id], // passing null unassigns the custom currency
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: "Country not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Country currency mapping updated successfully",
      country: rows[0],
    });
  } catch (err) {
    console.error("Error updating country currency mapping:", err);
    return NextResponse.json(
      { error: "Failed to update country mapping" },
      { status: 500 },
    );
  }
}