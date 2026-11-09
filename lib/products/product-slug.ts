import { slugify } from "@/lib/utils/slugify";

type QueryClient = {
  query: (text: string, params?: unknown[]) => Promise<{ rows: unknown[] }>;
};

async function isSlugTaken(
  client: QueryClient,
  slug: string,
  excludeProductId?: string | number | null,
): Promise<boolean> {
  const taken = await client.query(
    `SELECT 1 FROM store_products
     WHERE slug = $1
       AND ($2::text IS NULL OR id::text <> $2::text)
     LIMIT 1`,
    [slug, excludeProductId != null ? String(excludeProductId) : null],
  );
  return taken.rows.length > 0;
}

export async function resolveBrandNameForSlug(
  client: QueryClient,
  brandId: unknown,
): Promise<string> {
  if (brandId === undefined || brandId === null || brandId === "") return "";
  const result = await client.query(
    `SELECT name FROM store_brands WHERE brand_id = $1 LIMIT 1`,
    [brandId],
  );
  const row = result.rows[0] as { name?: string } | undefined;
  return String(row?.name ?? "");
}

/**
 * Prefer the desired slug. If it already exists, append brand (when available),
 * then numeric suffixes until unique.
 */
export async function allocateUniqueProductSlug(
  client: QueryClient,
  desiredSlug: string,
  excludeProductId?: string | number | null,
  brand?: string | null,
): Promise<string> {
  const base =
    String(desiredSlug || "")
      .toLowerCase()
      .trim()
      .replace(/[\s_]+/g, "-")
      .replace(/[^a-z0-9-]+/g, "")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "") || "product";

  if (!(await isSlugTaken(client, base, excludeProductId))) {
    return base;
  }

  const brandPart = brand ? slugify(brand) : "";
  const withBrand =
    brandPart && !base.endsWith(`-${brandPart}`)
      ? `${base}-${brandPart}`
      : base;

  if (
    withBrand !== base &&
    !(await isSlugTaken(client, withBrand, excludeProductId))
  ) {
    return withBrand;
  }

  const suffixBase = withBrand !== base ? withBrand : base;
  for (let n = 2; n < 1000; n++) {
    const candidate = `${suffixBase}-${n}`;
    if (!(await isSlugTaken(client, candidate, excludeProductId))) {
      return candidate;
    }
  }

  throw new Error("Could not generate a unique product slug");
}
