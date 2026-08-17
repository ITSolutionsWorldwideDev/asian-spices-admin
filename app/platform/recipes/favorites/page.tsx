import Link from "next/link";
import { pool } from "@/core/db";
import { requirePlatformAdmin } from "@/lib/auth/guards";
import RecipeFavoritesTable from "@/components/platform/recipes/RecipeFavoritesTable";

const PAGE_SIZE = 20;

export default async function RecipeFavoritesPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] }>;
}) {
  await requirePlatformAdmin();

  const params = searchParams ? await searchParams : {};
  const page = Number(params.page ?? 1);
  const q = params.q as string | undefined;
  const offset = (page - 1) * PAGE_SIZE;

  const where: string[] = [];
  const values: any[] = [];

  if (q) {
    values.push(`%${q}%`);
    where.push(`
      (
        r.title ILIKE $${values.length}
        OR r.slug ILIKE $${values.length}
        OR u.name ILIKE $${values.length}
        OR u.email ILIKE $${values.length}
      )
    `);
  }

  const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const { rows } = await pool.query(
    `
    SELECT
      r.id,
      r.title,
      r.slug,
      r.thumbnail_url,
      r.status,
      r.created_at,
      u.id AS owner_id,
      u.name AS owner_name,
      u.email AS owner_email,
      COALESCE(fav.likes_count, 0)::int AS likes_count,
      rld.discount_type,
      rld.discount_value,
      COUNT(*) OVER() AS total
    FROM recipes r
    LEFT JOIN users u
      ON u.id = r.created_by
    LEFT JOIN (
      SELECT recipe_id, COUNT(*)::int AS likes_count
      FROM recipe_favorites
      GROUP BY recipe_id
    ) fav
      ON fav.recipe_id = r.id
    LEFT JOIN recipe_like_discounts rld
      ON rld.recipe_id = r.id
    ${whereClause}
    ORDER BY likes_count DESC, r.created_at DESC
    LIMIT ${PAGE_SIZE}
    OFFSET ${offset}
    `,
    values,
  );

  const total = rows[0]?.total ?? 0;

  return (
    <div className="page-wrapper">
      <div className="content space-y-6">
        <div className="page-header flex justify-between items-center">
          <div>
            <h4 className="text-2xl font-bold">Recipe Likes</h4>
            <p className="text-gray-500 mt-1">
              See recipe owners, likes, and assign owner discounts based on likes
            </p>
          </div>

          <Link href="/platform/recipes" className="btn btn-secondary">
            Back to Recipes
          </Link>
        </div>

        <div className="card">
          <div className="card-header">
            <form className="flex gap-3" action="/platform/recipes/favorites">
              <input
                name="q"
                defaultValue={q || ""}
                placeholder="Search recipe or owner..."
                className="border rounded-lg px-3 py-2 w-full max-w-md"
              />
              <button type="submit" className="btn btn-primary">
                Search
              </button>
            </form>
          </div>

          <RecipeFavoritesTable
            recipes={rows}
            total={total}
            page={page}
            pageSize={PAGE_SIZE}
            q={q}
          />
        </div>
      </div>
    </div>
  );
}
