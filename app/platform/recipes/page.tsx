// app/platform/recipes/page.tsx

import { pool } from "@/core/db";
import { requirePlatformAdmin } from "@/lib/auth/guards";
import RecipesClient from "@/components/platform/recipes/RecipesClient";

const PAGE_SIZE = 9;

export default async function RecipesPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] }>;
}) {
  await requirePlatformAdmin();

  const params = searchParams ? await searchParams : {};

  const page = Number(params.page ?? 1);
  const q = params.q as string | undefined;
  const status = params.status as string | undefined;

  const offset = (page - 1) * PAGE_SIZE;

  const where: string[] = [];
  const values: any[] = [];

  if (q) {
    values.push(`%${q}%`);

    where.push(`
      (
        r.title ILIKE $${values.length}
        OR r.slug ILIKE $${values.length}
      )
    `);
  }

  if (status) {
    values.push(status);

    where.push(`r.status = $${values.length}`);
  }

  const whereClause = where.length
    ? `WHERE ${where.join(" AND ")}`
    : "";

  const { rows } = await pool.query(
    `
    SELECT
      r.id,
      r.title,
      r.slug,
      r.thumbnail_url,
      r.status,
      r.created_at,
      rc.name as category_name,
      COUNT(*) OVER() AS total

    FROM recipes r

    LEFT JOIN recipe_categories rc
      ON rc.id = r.category_id

    ${whereClause}

    ORDER BY r.created_at DESC

    LIMIT ${PAGE_SIZE}
    OFFSET ${offset}
    `,
    values
  );

  const total = rows[0]?.total ?? 0;

  return (
    <div className="page-wrapper">
      <div className="content">
        <RecipesClient
          recipes={rows}
          total={total}
          page={page}
          pageSize={PAGE_SIZE}
        />
      </div>
    </div>
  );
}