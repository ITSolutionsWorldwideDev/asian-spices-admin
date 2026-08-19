"use client";

import { useEffect, useState } from "react";
import { RefreshCw, Activity } from "lucide-react";

const SOURCE_COLORS: Record<string, string> = {
  general: "bg-blue-100 text-blue-700",
  user: "bg-purple-100 text-purple-700",
  billing: "bg-yellow-100 text-yellow-700",
};

const SOURCE_LABELS: Record<string, string> = {
  general: "Action",
  user: "User",
  billing: "Billing",
};

const ENTITY_ICONS: Record<string, string> = {
  order: "📦",
  product: "🛒",
  user: "👤",
  store: "🏪",
  shipment: "🚚",
  customer: "🙍",
  billing: "💳",
  return: "↩️",
  packaging: "📫",
  role: "🔑",
  tax: "🧾",
  currency: "💱",
  recipe: "🍽️",
  category: "📂",
  partner: "🤝",
  system: "⚙️",
};

function formatDate(ts: string) {
  return new Date(ts).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function capitalize(str: string) {
  if (!str) return "—";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Handles both old format "Recipe.create" and new format "created recipe"
function formatAction(action: string): string {
  if (!action) return "—";

  // Already a readable sentence (e.g. "created product", "fulfilled order")
  if (!action.includes(".")) return capitalize(action);

  // Dot-notation format e.g. "Recipe.create", "Store.active", "Partner.rejected"
  const parts = action.split(".");
  const entity = parts[0] ?? "";
  const verb = parts[1] ?? "";

  const VERB_MAP: Record<string, string> = {
    create: "Created",
    created: "Created",
    update: "Updated",
    updated: "Updated",
    delete: "Deleted",
    deleted: "Deleted",
    active: "Activated",
    activated: "Activated",
    inactive: "Deactivated",
    deactivated: "Deactivated",
    rejected: "Rejected",
    approved: "Approved",
    assign: "Assigned",
    assigned: "Assigned",
    remove: "Removed",
    removed: "Removed",
    plan_assigned: "Plan Assigned",
  };

  const readableVerb = VERB_MAP[verb.toLowerCase()] ?? capitalize(verb);
  return `${readableVerb} ${capitalize(entity)}`;
}

export default function ActivityLogPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const limit = 50;

  const fetchLogs = async (p = 1) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/activity?page=${p}&limit=${limit}`);
      const data = await res.json();
      setLogs(data.logs || []);
      setTotal(data.total || 0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(page);
  }, [page]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="page-wrapper">
      <div className="content max-w-6xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Activity className="text-blue-600" size={22} />
            <h1 className="text-2xl font-bold text-gray-900">Activity Log</h1>
            <span className="text-sm text-gray-400">
              ({total} total entries)
            </span>
          </div>
          <button
            onClick={() => fetchLogs(page)}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {/* Table */}
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="px-5 py-3 text-left">Time</th>
                <th className="px-5 py-3 text-left">Type</th>
                <th className="px-5 py-3 text-left">Action</th>
                <th className="px-5 py-3 text-left">Entity</th>
                <th className="px-5 py-3 text-left">Performed By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading && (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-400">
                    Loading…
                  </td>
                </tr>
              )}
              {!loading && logs.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="text-center py-12 text-gray-400 italic"
                  >
                    No activity recorded yet. Actions will appear here as you
                    use the admin panel.
                  </td>
                </tr>
              )}
              {!loading &&
                logs.map((log, i) => (
                  <tr
                    key={log.id ?? i}
                    className="hover:bg-gray-50 transition"
                  >
                    <td className="px-5 py-3 text-gray-500 whitespace-nowrap text-xs">
                      {formatDate(log.created_at)}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          SOURCE_COLORS[log.source] ??
                          "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {SOURCE_LABELS[log.source] ?? log.source}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-medium text-gray-800">
                      {formatAction(log.action)}
                    </td>
                    <td className="px-5 py-3 text-gray-600">
                      <span className="mr-1">
                        {ENTITY_ICONS[log.entity] ?? "•"}
                      </span>
                      {capitalize(log.entity || "—")}
                      {log.entity_id && (
                        <span className="ml-1 text-xs text-gray-400">
                          #{log.entity_id.slice(0, 6)}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-gray-500 text-xs">
                      {log.actor_label
                        ? log.actor_label.includes("@")
                          ? log.actor_label
                          : log.actor_label.slice(0, 12) + "…"
                        : "—"}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1.5 border rounded-lg disabled:opacity-40 hover:bg-gray-50"
              >
                Previous
              </button>
              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 border rounded-lg disabled:opacity-40 hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
