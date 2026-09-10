// app/api/currencies/route.ts

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/core/db";
// import { getCurrentStoreAPI } from "@/lib/auth/guards";

export async function GET(req: NextRequest) {
  const client = await pool.connect();

  try {
    const shippableOnly =
      new URL(req.url).searchParams.get("shippable") === "true";

    // Sync shippable-country currencies into `currencies`, then list ALL currencies
    if (shippableOnly) {
      await client.query("BEGIN");

      // 1) Insert any missing codes from shippable countries
      //    (re-creates currencies deleted since last load)
      await client.query(`
        INSERT INTO currencies (id, code, name, symbol, is_active)
        SELECT
          gen_random_uuid(),
          src.code,
          src.name,
          src.symbol,
          true
        FROM (
          SELECT DISTINCT ON (UPPER(TRIM(c.currency_code)))
            UPPER(TRIM(c.currency_code)) AS code,
            COALESCE(
              NULLIF(TRIM(c.currency_name), ''),
              UPPER(TRIM(c.currency_code))
            ) AS name,
            COALESCE(NULLIF(TRIM(c.currency_symbol), ''), '') AS symbol
          FROM countries c
          WHERE c.is_shippable = true
            AND c.currency_code IS NOT NULL
            AND TRIM(c.currency_code) <> ''
          ORDER BY UPPER(TRIM(c.currency_code))
        ) src
        WHERE NOT EXISTS (
          SELECT 1
          FROM currencies cur
          WHERE UPPER(TRIM(cur.code)) = src.code
        )
      `);

      // 2) Keep name/symbol aligned with shippable countries
      await client.query(`
        UPDATE currencies cur
        SET
          name = src.name,
          symbol = src.symbol,
          is_active = true
        FROM (
          SELECT DISTINCT ON (UPPER(TRIM(c.currency_code)))
            UPPER(TRIM(c.currency_code)) AS code,
            COALESCE(
              NULLIF(TRIM(c.currency_name), ''),
              UPPER(TRIM(c.currency_code))
            ) AS name,
            COALESCE(NULLIF(TRIM(c.currency_symbol), ''), '') AS symbol
          FROM countries c
          WHERE c.is_shippable = true
            AND c.currency_code IS NOT NULL
            AND TRIM(c.currency_code) <> ''
          ORDER BY UPPER(TRIM(c.currency_code))
        ) src
        WHERE UPPER(TRIM(cur.code)) = src.code
      `);

      // Fix any existing rows that were inserted without an id
      await client.query(`
        UPDATE currencies
        SET id = gen_random_uuid()
        WHERE id IS NULL
      `);

      // 3) Show ALL currencies from the currencies table
      const { rows } = await client.query(`
        SELECT DISTINCT ON (UPPER(TRIM(cur.code)))
          cur.id,
          cur.code,
          cur.name,
          cur.symbol,
          cur.decimal_places,
          cur.is_base
        FROM currencies cur
        WHERE COALESCE(cur.is_active, true) = true
          AND cur.id IS NOT NULL
          AND cur.code IS NOT NULL
          AND TRIM(cur.code) <> ''
        ORDER BY UPPER(TRIM(cur.code)), cur.id
      `);

      await client.query("COMMIT");
      return NextResponse.json({ items: rows });
    }

    const { rows } = await client.query(`
      SELECT id, code, name, symbol, decimal_places,is_base
      FROM currencies
      WHERE is_active = true
      ORDER BY code ASC
    `);

    return NextResponse.json({ items: rows });
  } catch (err: any) {
    try {
      await client.query("ROLLBACK");
    } catch {
      // ignore rollback errors when no transaction was started
    }
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}


export async function POST(req: NextRequest) {
  try {
    const { code, name, symbol } = await req.json();

    const { rows } = await pool.query(
      `
      INSERT INTO currencies (code, name, symbol)
      VALUES ($1, $2, $3)
      RETURNING *
      `,
      [code.toUpperCase(), name, symbol]
    );

    return NextResponse.json(rows[0]);
  } catch (err) {
    return NextResponse.json({ error: "Create failed" }, { status: 500 });
  }
}
