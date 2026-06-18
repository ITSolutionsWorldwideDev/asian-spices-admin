// components/shipping/providers/ProviderCard.tsx

"use client";

import Link from "next/link";
import { Edit, Trash2, Power } from "react-feather";

type Provider = {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  created_at: string;
};

export default function ProviderCard({
  provider,
  onDelete,
  onToggleStatus,
}: {
  provider: Provider;
  onDelete: () => void;
  onToggleStatus: () => void;
}) {
  return (
    <div className="bg-white rounded-xl border shadow-sm p-5 flex flex-col justify-between hover:shadow-md transition">
      {/* TOP */}
      <div>
        <div className="flex justify-between items-start mb-3">
          <h3 className="font-semibold text-sm">{provider.name}</h3>

          <span
            className={`text-xs px-2 py-1 rounded-full ${
              provider.is_active
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-500"
            }`}
          >
            {provider.is_active ? "Active" : "Disabled"}
          </span>
        </div>

        <p className="text-xs text-gray-500 mb-3">{provider.slug}</p>
      </div>

      {/* FOOTER */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>
          {new Date(provider.created_at).toISOString().split("T")[0]}
        </span>

        <div className="flex gap-2">
          <Link
            href={`/platform/shipping/providers/${provider.id}`}
            className="p-1 hover:text-blue-600"
          >
            <Edit size={14} />
          </Link>

          <button
            onClick={onToggleStatus}
            className="p-1 hover:text-yellow-600"
          >
            <Power size={14} />
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
