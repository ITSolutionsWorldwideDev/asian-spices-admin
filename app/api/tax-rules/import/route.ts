import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { pool } from "@/core/db";
import { requirePlatformAdmin } from "@/lib/auth/guards";

type ImportError = {
  row: number;
  error: string;
};

function getValue(row: Record<string, any>, keys: string[]) {
  const normalized = Object.keys(row).reduce(
    (acc, key) => {
      acc[key.toLowerCase().trim()] = row[key];
      return acc;
    },
    {} as Record<string, any>,
  );

  for (const key of keys) {
    const value = normalized[key.toLowerCase().trim()];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return value;
    }
  }
  return null;
}

function parseBoolean(value: any, fallback = true) {
  if (value === null || value === undefined || String(value).trim() === "") {
    return fallback;
  }

  const normalized = String(value).trim().toLowerCase();
  if (["true", "1", "yes", "y", "active"].includes(normalized)) return true;
  if (["false", "0", "no", "n", "inactive"].includes(normalized)) return false;
  return fallback;
}

function parseRate(value: any) {
  if (value === null || value === undefined) return NaN;
  const normalized = String(value).replace("%", "").trim();
  return Number(normalized);
}

export async function POST(req: NextRequest) {
  await requirePlatformAdmin();

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "CSV file is required" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, {
    defval: "",
  });

  if (!rows.length) {
    return NextResponse.json({ error: "File contains no rows" }, { status: 400 });
  }

  const client = await pool.connect();
  try {
    const categoriesResult = await client.query<{ id: string; name: string }>(
      `SELECT id, name FROM store_categories`,
    );
    const countriesResult = await client.query<{
      iso2: string;
      name: string;
    }>(`
      SELECT country_code AS iso2, country_name AS name
      FROM countries
    `);

    const categoryByName = new Map(
      categoriesResult.rows.map((item) => [item.name.toLowerCase().trim(), item.id]),
    );
    const categoryById = new Set(categoriesResult.rows.map((item) => item.id));
    const countryByName = new Map(
      countriesResult.rows.map((item) => [item.name.toLowerCase().trim(), item.iso2]),
    );
    const countryByIso2 = new Set(
      countriesResult.rows.map((item) => item.iso2.toUpperCase()),
    );

    let inserted = 0;
    let updated = 0;
    const errors: ImportError[] = [];

    for (let i = 0; i < rows.length; i++) {
      const rowNumber = i + 2;
      const row = rows[i];

      try {
        const countryCodeRaw = getValue(row, [
          "country_code",
          "country",
          "country code",
          "iso2",
        ]);
        const taxName = getValue(row, ["tax_name", "name", "tax type"]);
        const taxRateRaw = getValue(row, ["tax_rate", "rate", "percentage"]);
        const isActiveRaw = getValue(row, ["is_active", "active", "status"]);
        const categoryIdRaw = getValue(row, ["category_id"]);
        const categoryNameRaw = getValue(row, [
          "category_name",
          "category",
          "linked category",
        ]);

        if (!countryCodeRaw || !taxName || taxRateRaw === null) {
          errors.push({
            row: rowNumber,
            error: "country_code, tax_name and tax_rate are required",
          });
          continue;
        }

        const parsedCountry = String(countryCodeRaw).trim();
        const directIso = parsedCountry.toUpperCase();
        const countryCode =
          countryByIso2.has(directIso)
            ? directIso
            : countryByName.get(parsedCountry.toLowerCase()) || null;

        if (!countryCode) {
          errors.push({
            row: rowNumber,
            error: `country '${parsedCountry}' was not found`,
          });
          continue;
        }

        const taxRate = parseRate(taxRateRaw);
        if (Number.isNaN(taxRate)) {
          errors.push({ row: rowNumber, error: "tax_rate must be numeric" });
          continue;
        }

        let resolvedCategoryId: string | null = null;

        if (categoryIdRaw) {
          const parsedCategoryId = String(categoryIdRaw).trim();
          if (!categoryById.has(parsedCategoryId)) {
            errors.push({
              row: rowNumber,
              error: `category_id '${parsedCategoryId}' was not found`,
            });
            continue;
          }
          resolvedCategoryId = parsedCategoryId;
        } else if (categoryNameRaw) {
          const parsedCategoryName = String(categoryNameRaw).toLowerCase().trim();
          const matchedCategoryId = categoryByName.get(parsedCategoryName);
          if (!matchedCategoryId) {
            errors.push({
              row: rowNumber,
              error: `category_name '${categoryNameRaw}' was not found`,
            });
            continue;
          }
          resolvedCategoryId = matchedCategoryId;
        }

        const result = await client.query<{ inserted: boolean }>(
          `INSERT INTO platform_tax_rules (
            country_code,
            tax_name,
            tax_rate,
            is_active,
            category_id
          )
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT ON CONSTRAINT unique_country_tax_rule
          DO UPDATE SET
            tax_rate = EXCLUDED.tax_rate,
            is_active = EXCLUDED.is_active,
            category_id = EXCLUDED.category_id,
            updated_at = NOW()
          RETURNING (xmax = 0) AS inserted`,
          [
            String(countryCode).trim().toUpperCase(),
            String(taxName).trim(),
            taxRate,
            parseBoolean(isActiveRaw, true),
            resolvedCategoryId,
          ],
        );

        if (result.rows[0]?.inserted) inserted++;
        else updated++;
      } catch (error: any) {
        errors.push({
          row: rowNumber,
          error: error?.message || "Row import failed",
        });
      }
    }

    return NextResponse.json({
      total: rows.length,
      inserted,
      updated,
      failed: errors.length,
      errors,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Tax CSV import failed" },
      { status: 500 },
    );
  } finally {
    client.release();
  }
}
