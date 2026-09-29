type QueryClient = {
  query: (text: string, params?: unknown[]) => Promise<{ rows: unknown[] }>;
};

/** URL slug that does not collide with another store. */
export async function allocateUniqueStoreSlug(
  client: QueryClient,
  desiredSlug: string,
  excludeStoreId?: string | null,
): Promise<string> {
  const base =
    String(desiredSlug || "")
      .toLowerCase()
      .trim()
      .replace(/[\s_]+/g, "-")
      .replace(/[^a-z0-9-]+/g, "")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "") || "store";

  let candidate = base;
  for (let n = 2; n < 1000; n++) {
    const taken = await client.query(
      `SELECT 1 FROM stores
       WHERE slug = $1
         AND ($2::uuid IS NULL OR id <> $2::uuid)
       LIMIT 1`,
      [candidate, excludeStoreId ?? null],
    );
    if (taken.rows.length === 0) return candidate;
    candidate = `${base}-${n}`;
  }

  throw new Error("Could not generate a unique store slug");
}
