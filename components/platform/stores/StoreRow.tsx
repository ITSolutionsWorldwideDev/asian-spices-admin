// apps/admin/app/(platform)/platform/stores/StoreRow.tsx
"use client";

import DeleteStoreBtn from "./DeleteStoreBtn";

type Store = {
  id: string;
  name: string;
  slug: string;
  status: string;
};

export default function StoreRow({ store }: { store: Store }) {
  return (
    <div className="flex items-center justify-between p-4 hover:bg-gray-50">
      {store.status === "suspended" && (
        <span className="badge badge-warning">Suspended</span>
      )}
      <div>
        <p className="font-medium">{store.name}</p>
        <p className="text-sm text-gray-500">{store.slug}</p>
      </div>

      <div className="flex gap-2">
        <a
          href={`/platform/stores/${store.id}`}
          className="btn btn-sm btn-secondary"
        >
          Edit
        </a>

        <DeleteStoreBtn storeId={store.id} />
      </div>
    </div>
  );
}
