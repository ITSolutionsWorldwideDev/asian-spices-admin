// apps/admin/components/media/FeaturedImageUpload.tsx
"use client";

import { UploadButton } from "@uploadthing/react";
import type { MediaRouter } from "@/app/api/uploadthing/core";
import { useToast } from "@/core/ui";

export default function FeaturedImageUpload({
  onUpload,
}: {
  onUpload: (mediaId: number, url: string) => void;
}) {
  const { showToast } = useToast();
  return (
    <UploadButton<MediaRouter, "productImage">
      endpoint="productImage"
      className="rounded border border-dashed border-gray-400 px-6 py-3 hover:border-primary "
      onClientUploadComplete={async (res) => {
        console.log("CLIENT UPLOAD DONE", res);
        const file = res?.[0];

        // ✅ Safety checks
        if (!file || !file.ufsUrl) {
          showToast("error", "Upload failed: invalid file response");
          return;
        }

        try {
          const response = await fetch("/api/media/save", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              file_name: file.name,
              file_url: file.ufsUrl, // ✅ correct
              file_type: file.type,
              size: file.size,
            }),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data?.error || "Failed to save media");
          }

          // ✅ SINGLE success message
          showToast("success", "Upload + Save successful ✅");
        } catch (err: any) {
          console.error("SAVE ERROR ❌", err);
          showToast("error", err.message || "Something went wrong");
        }
      }}
      onUploadError={(err) => {
        showToast("error", err.message);
      }}
    />
  );
}
/* 
      onClientUploadComplete={(res) => {
        const file = res?.[0];
        if (file) {
          onUpload(file.serverData.mediaId, file.url);
          showToast("success", "Upload complete");
        }
      }}
*/
