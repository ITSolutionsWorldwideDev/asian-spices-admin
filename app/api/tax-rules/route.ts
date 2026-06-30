// app/api/tax-rules/route.ts

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/core/db";
import { requirePlatformAdmin } from "@/lib/auth/guards";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const country = searchParams.get("country");

    let query = `
      SELECT id, country_code, state_code, tax_name, tax_rate, is_active, category_id, created_at, updated_at
      FROM platform_tax_rules
      WHERE 1=1
    `;
    const params: any[] = [];

    if (country) {
      params.push(country.toUpperCase());
      query += ` AND country_code = $1`;
    }

    query += ` ORDER BY country_code ASC, tax_rate DESC`;
    const result = await pool.query(query, params);

    return NextResponse.json({ items: result.rows });
  } catch (error: any) {
    console.error("Fetch tax rules failure:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  await requirePlatformAdmin();
  try {
    const body = await req.json();
    const { country_code, tax_name, tax_rate, category_id = null } = body;

    if (!country_code || !tax_name || tax_rate === undefined) {
      return NextResponse.json({ error: "Missing required properties" }, { status: 400 });
    }

    const result = await pool.query(
      `INSERT INTO platform_tax_rules (country_code, tax_name, tax_rate, category_id)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [country_code.toUpperCase(), tax_name, tax_rate, category_id || null],
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error: any) {
    console.error("Database operation failure:", error);

    // Handle PostgreSQL Unique Constraint Violations
    if (error.code === "23505") {
      // 🌟 Updated to match your new country-scoped category validation rule
      if (error.constraint === "unique_category_per_country") {
        return NextResponse.json(
          { error: "This category is already assigned to a tax rule within the selected country." },
          { status: 409 }
        );
      }
      
      if (error.constraint === "unique_country_tax_rule") {
        return NextResponse.json(
          { error: "A tax rule with this identical name already exists for this country." },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      { error: error.message || "An unexpected error occurred while saving." },
      { status: 500 },
    );
  }
}

export async function PUT(req: NextRequest) {
  await requirePlatformAdmin();
  try {
    const body = await req.json();
    const { id, tax_name, tax_rate, is_active, category_id = null } = body;

    const updateRes = await pool.query(
      `UPDATE platform_tax_rules 
       SET tax_name = COALESCE($1, tax_name), 
           tax_rate = COALESCE($2, tax_rate), 
           is_active = COALESCE($3, is_active), 
           category_id = $4,
           updated_at = NOW()
       WHERE id = $5 RETURNING *`,
      [tax_name, tax_rate, is_active, category_id || null, id],
    );

    if (updateRes.rowCount === 0) {
      return NextResponse.json({ error: "Tax rule not found" }, { status: 404 });
    }

    return NextResponse.json(updateRes.rows[0]);
  } catch (error: any) {
    console.error("Database operation failure:", error);

    // Handle PostgreSQL Unique Constraint Violations
    if (error.code === "23505") {
      // 🌟 Updated to match your new country-scoped category validation rule
      if (error.constraint === "unique_category_per_country") {
        return NextResponse.json(
          { error: "This category is already assigned to a tax rule within the selected country." },
          { status: 409 }
        );
      }
      
      if (error.constraint === "unique_country_tax_rule") {
        return NextResponse.json(
          { error: "A tax rule with this identical name already exists for this country." },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      { error: error.message || "An unexpected error occurred while saving." },
      { status: 500 },
    );
  }
}

// 3️⃣ NEW DELETE FUNCTIONALITY
export async function DELETE(req: NextRequest) {
  await requirePlatformAdmin();
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Tax rule ID parameter missing" }, { status: 400 });
    }

    const deleteRes = await pool.query(
      `DELETE FROM platform_tax_rules WHERE id = $1 RETURNING id`,
      [id]
    );

    if (deleteRes.rowCount === 0) {
      return NextResponse.json({ error: "Tax rule record variant not located" }, { status: 404 });
    }

    return NextResponse.json({ success: true, deletedId: id });
  } catch (error: any) {
    console.error("Delete tax rule failure:", error);
    return NextResponse.json({ error: "Removal execution breakdown" }, { status: 500 });
  }
}

/* 
import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/core/db";
import { requirePlatformAdmin } from "@/lib/auth/guards";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const country = searchParams.get("country");

    let query = `
      SELECT tr.*, COALESCE(json_agg(ctm.category_id) FILTER (WHERE ctm.category_id IS NOT NULL), '[]') as assigned_categories
      FROM platform_tax_rules tr
      LEFT JOIN category_tax_mappings ctm ON tr.id = ctm.tax_rule_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (country) {
      params.push(country.toUpperCase());
      query += ` AND tr.country_code = $1`;
    }

    query += ` GROUP BY tr.id ORDER BY tr.country_code ASC, tr.tax_rate DESC`;
    const result = await pool.query(query, params);

    return NextResponse.json({ items: result.rows });
  } catch (error: any) {
    console.error("Fetch tax rules failure:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  await requirePlatformAdmin();
  const client = await pool.connect();
  try {
    const body = await req.json();
    const { country_code, tax_name, tax_rate, assigned_categories = [] } = body;

    if (!country_code || !tax_name || tax_rate === undefined) {
      return NextResponse.json(
        { error: "Missing properties" },
        { status: 400 },
      );
    }

    await client.query("BEGIN");

    // 1️⃣ Insert Tax Definition Rule
    const taxInsertRes = await client.query(
      `INSERT INTO platform_tax_rules (country_code, tax_name, tax_rate)
       VALUES ($1, $2, $3) RETURNING *`,
      [country_code.toUpperCase(), tax_name, tax_rate],
    );
    const newTaxRule = taxInsertRes.rows[0];

    // 2️⃣ Map Categories to this rule
    if (assigned_categories.length > 0) {
      const mappingValues = assigned_categories
        .map((catId: string) => `('${catId}', '${newTaxRule.id}')`)
        .join(",");
      await client.query(
        `INSERT INTO category_tax_mappings (category_id, tax_rule_id) VALUES ${mappingValues}`,
      );
    }

    await client.query("COMMIT");
    return NextResponse.json(newTaxRule, { status: 201 });
  } catch (error: any) {
    await client.query("ROLLBACK");
    console.error("Create tax rule failure:", error);
    return NextResponse.json(
      { error: error.message || "Execution exception" },
      { status: 500 },
    );
  } finally {
    client.release();
  }
}

export async function PUT(req: NextRequest) {
  await requirePlatformAdmin();
  const client = await pool.connect();
  try {
    const body = await req.json();
    const {
      id,
      tax_name,
      tax_rate,
      is_active,
      assigned_categories = [],
    } = body;

    await client.query("BEGIN");

    const updateRes = await client.query(
      `UPDATE platform_tax_rules 
       SET tax_name = COALESCE($1, tax_name), 
           tax_rate = COALESCE($2, tax_rate), 
           is_active = COALESCE($3, is_active), 
           updated_at = NOW()
       WHERE id = $4 RETURNING *`,
      [tax_name, tax_rate, is_active, id],
    );

    if (updateRes.rowCount === 0) {
      await client.query("ROLLBACK");
      return NextResponse.json(
        { error: "Tax rule not found" },
        { status: 404 },
      );
    }

    // Refresh Category Mappings
    await client.query(
      `DELETE FROM category_tax_mappings WHERE tax_rule_id = $1`,
      [id],
    );
    if (assigned_categories.length > 0) {
      const mappingValues = assigned_categories
        .map((catId: string) => `('${catId}', '${id}')`)
        .join(",");
      await client.query(
        `INSERT INTO category_tax_mappings (category_id, tax_rule_id) VALUES ${mappingValues}`,
      );
    }

    await client.query("COMMIT");
    return NextResponse.json(updateRes.rows[0]);
  } catch (error: any) {
    await client.query("ROLLBACK");
    return NextResponse.json(
      { error: "Update execution failed" },
      { status: 500 },
    );
  } finally {
    client.release();
  }
}
 */