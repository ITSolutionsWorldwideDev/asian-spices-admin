type RecipeEngagementProps = {
  owner?: {
    id?: string;
    name?: string | null;
    email?: string | null;
  } | null;
  likesCount?: number;
  recentFavorites?: {
    id: string;
    created_at: string;
    customer_id: string;
    customer_name?: string | null;
    customer_email?: string | null;
  }[];
};

export default function RecipeEngagement({
  owner,
  likesCount = 0,
  recentFavorites = [],
}: RecipeEngagementProps) {
  return (
    <div className="border rounded-lg p-4 space-y-4">
      <div>
        <h3 className="font-semibold">Recipe Likes & Owner</h3>
        <p className="text-xs text-gray-500 mt-1">
          Saved by users from the customer portal
        </p>
      </div>

      <div className="rounded-lg bg-gray-50 p-3">
        <p className="text-xs uppercase tracking-wide text-gray-500">Total likes</p>
        <p className="text-2xl font-bold text-pink-600 mt-1">
          {Number(likesCount).toLocaleString()}
        </p>
      </div>

      <div className="rounded-lg bg-gray-50 p-3">
        <p className="text-xs uppercase tracking-wide text-gray-500">Recipe owner</p>
        {owner?.name || owner?.email ? (
          <div className="mt-2">
            <p className="font-medium">{owner.name || "Unnamed user"}</p>
            <p className="text-sm text-gray-500">{owner.email || "—"}</p>
          </div>
        ) : (
          <p className="text-sm text-gray-400 mt-2">Unknown owner</p>
        )}
      </div>

      <div>
        <p className="text-sm font-medium mb-2">Recent likes</p>

        {recentFavorites.length === 0 ? (
          <p className="text-sm text-gray-400">No likes yet</p>
        ) : (
          <ul className="space-y-2 max-h-48 overflow-y-auto">
            {recentFavorites.map((favorite) => (
              <li
                key={favorite.id}
                className="text-sm border rounded-lg px-3 py-2 bg-white"
              >
                <p className="font-medium">
                  {favorite.customer_name || "Customer"}
                </p>
                <p className="text-xs text-gray-500">
                  {favorite.customer_email || favorite.customer_id}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(favorite.created_at).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
