// app/(platform)/platform/stores/DeleteStoreBtn.tsx
"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

export default function DeleteStoreBtn({ storeId }: { storeId: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleDelete() {
    if (!confirm("Are you sure you want to delete this store?")) return;

    startTransition(async () => {
      await fetch(`/api/stores/${storeId}`, {
        method: "DELETE"
      });

      router.refresh();
    });
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="btn btn-sm btn-danger"
    >
      {isPending ? "Deleting..." : "Delete"}
    </button>
  );
}
