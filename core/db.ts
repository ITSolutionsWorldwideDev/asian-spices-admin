// core/db.ts

import { Pool } from "pg";
import type { QueryResult, QueryResultRow } from "pg";

// 🟢 FIXED: Safely extend globalThis types without using aggressive casting shortcuts
declare global {
  var varGlobalPool: Pool | undefined;
}

export const pool =
  globalThis.varGlobalPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    // 🟢 OPTIMIZED: Scaled settings tailored to prevent serverless pool exhaustion
    max: 20, 
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000, // Raised to 10s to gracefully survive sudden server lag spikes
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.varGlobalPool = pool;
}

/**
 * Executes a type-safe raw PostgreSQL query using the connection pool
 * @param text The SQL query string (e.g., 'SELECT * FROM users WHERE id = $1')
 * @param params Array of dynamic query arguments matching placeholders
 */
export async function runQuery<
  T extends QueryResultRow = QueryResultRow
>(
  text: string,
  params?: unknown[]
): Promise<QueryResult<T>> {
  const start = Date.now();

  try {
    const result = await pool.query<T>(text, params);

    if (process.env.NODE_ENV !== "production") {
      const duration = Date.now() - start;
      console.log(
        `[Database Query] ${duration}ms | Rows: ${result.rowCount}`
      );
    }

    return result;
  } catch (error) {
    console.error("[Database Query Error]", error);
    throw error;
  }
}

type SqlBuildResult = {
  text: string;
  values: any[];
};

/**
 * Build INSERT query dynamically
 */
export function buildInsertQuery(
  table: string,
  data: Record<string, unknown>
): SqlBuildResult {
  const keys = Object.keys(data);
  const values = Object.values(data);

  return {
    text: `INSERT INTO ${table} (${keys.join(", ")})
           VALUES (${keys.map((_, i) => `$${i + 1}`).join(", ")})
           RETURNING *`,
    values,
  };
}

/**
 * Build UPDATE query dynamically
 */
export function buildUpdateQuery(
  table: string,
  data: Record<string, unknown>,
  where: {
    column: string;
    value: unknown;
  }
): SqlBuildResult {
  const keys = Object.keys(data);
  const values = Object.values(data);

  const setClause = keys
    .map((key, i) => `${key} = $${i + 2}`)
    .join(", ");

  return {
    text: `UPDATE ${table}
           SET ${setClause}
           WHERE ${where.column} = $1
           RETURNING *`,
    values: [where.value, ...values],
  };
}

export type { QueryResult, QueryResultRow } from "pg";