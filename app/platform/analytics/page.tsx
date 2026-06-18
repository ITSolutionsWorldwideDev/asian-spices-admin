// app/platform/analytics/page.tsx
import { pool } from "@/core/db";

export default async function RecipesAnalyticsPage() {
  /*
   * OVERVIEW STATS
   */
  const [recipesRes, viewsRes, favoritesRes, categoriesRes, topRecipesRes] =
    await Promise.all([
      pool.query(`
      SELECT COUNT(*)::int AS total
      FROM recipes
    `),

      pool.query(`
      SELECT COUNT(*)::int AS total
      FROM recipe_views
    `),

      pool.query(`
      SELECT COUNT(*)::int AS total
      FROM recipe_favorites
    `),

      pool.query(`
      SELECT COUNT(*)::int AS total
      FROM recipe_categories
      WHERE is_active = true
    `),

      pool.query(`
      SELECT
        r.id,
        r.title,
        r.slug,
        r.thumbnail_url,

        COUNT(rv.id)::int AS views,

        (
          SELECT COUNT(*)
          FROM recipe_favorites rf
          WHERE rf.recipe_id = r.id
        )::int AS favorites

      FROM recipes r

      LEFT JOIN recipe_views rv
        ON rv.recipe_id = r.id

      GROUP BY r.id

      ORDER BY views DESC

      LIMIT 10
    `),
    ]);

  const stats = {
    totalRecipes: recipesRes.rows[0]?.total || 0,

    totalViews: viewsRes.rows[0]?.total || 0,

    totalFavorites: favoritesRes.rows[0]?.total || 0,

    totalCategories: categoriesRes.rows[0]?.total || 0,
  };

  const topRecipes = topRecipesRes.rows || [];

  return (
    <div className="page-wrapper">
      <div className="content space-y-6">
        {/* HEADER */}
        <div className="page-header">
          <div>
            <h4 className="text-2xl font-bold">Recipe Analytics</h4>

            <p className="text-gray-500 mt-1">
              Insights and performance of your recipe content
            </p>
          </div>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          <AnalyticsCard
            title="Total Recipes"
            value={stats.totalRecipes}
            color="bg-blue-500"
          />

          <AnalyticsCard
            title="Recipe Views"
            value={stats.totalViews}
            color="bg-green-500"
          />

          <AnalyticsCard
            title="Favorites"
            value={stats.totalFavorites}
            color="bg-pink-500"
          />

          <AnalyticsCard
            title="Categories"
            value={stats.totalCategories}
            color="bg-orange-500"
          />
        </div>

        {/* TOP RECIPES */}
        <div className="card">
          <div className="card-header flex justify-between items-center">
            <div>
              <h5 className="font-semibold text-lg">Top Viewed Recipes</h5>

              <p className="text-sm text-gray-500">Most engaging recipes</p>
            </div>
          </div>

          <div className="card-body p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-6 py-4 text-sm font-semibold">
                      Recipe
                    </th>

                    <th className="text-left px-6 py-4 text-sm font-semibold">
                      Views
                    </th>

                    <th className="text-left px-6 py-4 text-sm font-semibold">
                      Favorites
                    </th>

                    <th className="text-left px-6 py-4 text-sm font-semibold">
                      Engagement
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {topRecipes.map((recipe: any) => {
                    const engagement =
                      recipe.views > 0
                        ? ((recipe.favorites / recipe.views) * 100).toFixed(1)
                        : 0;

                    return (
                      <tr key={recipe.id} className="border-b hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <img
                              src={recipe.thumbnail_url || "/placeholder.png"}
                              alt={recipe.title}
                              className="w-16 h-16 rounded-lg object-cover border"
                            />

                            <div>
                              <p className="font-semibold">{recipe.title}</p>

                              <p className="text-sm text-gray-500">
                                {recipe.slug}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 font-semibold">
                          {Number(recipe.views).toLocaleString()}
                        </td>

                        <td className="px-6 py-4 font-semibold">
                          {Number(recipe.favorites).toLocaleString()}
                        </td>

                        <td className="px-6 py-4">
                          <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-medium">
                            {engagement}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}

                  {topRecipes.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="text-center py-12 text-gray-500"
                      >
                        No analytics data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* SECONDARY GRID */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* MOST FAVORITED */}
          <div className="card">
            <div className="card-header">
              <h5 className="font-semibold">Content Performance</h5>
            </div>

            <div className="card-body space-y-5">
              <MetricRow
                label="Average Views Per Recipe"
                value={
                  stats.totalRecipes > 0
                    ? Math.round(stats.totalViews / stats.totalRecipes)
                    : 0
                }
              />

              <MetricRow
                label="Average Favorites Per Recipe"
                value={
                  stats.totalRecipes > 0
                    ? Math.round(stats.totalFavorites / stats.totalRecipes)
                    : 0
                }
              />

              <MetricRow
                label="Favorite Ratio"
                value={`${
                  stats.totalViews > 0
                    ? ((stats.totalFavorites / stats.totalViews) * 100).toFixed(
                        1,
                      )
                    : 0
                }%`}
              />
            </div>
          </div>

          {/* QUICK INSIGHTS */}
          <div className="card">
            <div className="card-header">
              <h5 className="font-semibold">Quick Insights</h5>
            </div>

            <div className="card-body space-y-4">
              <InsightBox
                color="blue"
                title="Content Growth"
                text="Recipe content engagement is actively increasing based on user interactions."
              />

              <InsightBox
                color="green"
                title="Top Performing Content"
                text="Video recipes with thumbnails generally receive higher engagement."
              />

              <InsightBox
                color="orange"
                title="Optimization"
                text="Featured recipes can improve homepage visibility and conversion."
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AnalyticsCard({
  title,
  value,
  color,
}: {
  title: string;

  value: number;

  color: string;
}) {
  return (
    <div className="bg-white rounded-xl border p-6">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-gray-500 text-sm">{title}</p>

          <h3 className="text-3xl font-bold mt-2">
            {Number(value).toLocaleString()}
          </h3>
        </div>

        <div className={`w-12 h-12 rounded-lg ${color}`} />
      </div>
    </div>
  );
}

function MetricRow({
  label,
  value,
}: {
  label: string;

  value: string | number;
}) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-gray-600">{label}</span>

      <span className="font-bold">{value}</span>
    </div>
  );
}

function InsightBox({
  title,
  text,
  color,
}: {
  title: string;

  text: string;

  color: "blue" | "green" | "orange";
}) {
  const colors = {
    blue: "bg-blue-50 border-blue-200",

    green: "bg-green-50 border-green-200",

    orange: "bg-orange-50 border-orange-200",
  };

  return (
    <div className={`border rounded-xl p-4 ${colors[color]}`}>
      <h6 className="font-semibold mb-1">{title}</h6>

      <p className="text-sm text-gray-600">{text}</p>
    </div>
  );
}
