// app/api/countries/route.ts

import { NextResponse } from "next/server";
import { pool } from "@/core/db";

export async function GET() {
  try {
    const result = await pool.query(
      `SELECT country_id as id, country_name as  name, country_code as iso2, currency_code
       FROM countries
       ORDER BY country_name ASC`,
    );

    if (!result.rows.length) {
      return NextResponse.json(
        { error: "Country not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(result.rows);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch countries" },
      { status: 500 },
    );
  }
}
