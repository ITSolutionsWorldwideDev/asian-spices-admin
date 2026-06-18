// components/platform/stores/StoreCard.tsx

"use client";

import Link from "next/link";
import { Edit, Trash2, Pause, Play } from "react-feather";

type Store = {
  id: string;
  name: string;
  partner_registration_id?: string;
  slug: string;
  status: "active" | "suspended";
  created_at: string;
};

export default function StoreCard({
  store,
  onDelete,
  onToggleStatus
}: {
  store: Store;
  onDelete: () => void;
  onToggleStatus: () => void;
}) {

  // console.log('store === ',store)
  return (
    <div className="bg-white rounded-lg shadow-sm border p-4 flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-sm line-clamp-2">
            {store.name}
          </h3>

          <span
            className={`text-xs px-2 py-1 rounded-full ${
              store.status === "active"
                ? "bg-green-100 text-green-700"
                : "bg-yellow-100 text-yellow-700"
            }`}
          >
            {store.status}
          </span>
        </div>

        <p className="text-xs text-gray-500">
          Application ID: {store.partner_registration_id}
        </p>

        <p className="text-xs text-gray-500 mb-3">
          {store.slug}
        </p>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>
          {/* {new Date(store.created_at).toLocaleDateString()} */}
          {new Date(store.created_at).toISOString().split("T")[0]}
        </span>

        <div className="flex gap-2">
          <Link
            href={`/platform/stores/${store.id}`}
            className="p-1 hover:text-blue-600"
          >
            <Edit size={14} />
          </Link>

          <button
            onClick={onToggleStatus}
            className="p-1 hover:text-yellow-600"
          >
            {store.status === "active" ? (
              <Pause size={14} />
            ) : (
              <Play size={14} />
            )}
          </button>

          <button
            onClick={onDelete}
            className="p-1 hover:text-red-600"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
