// components/media/FeaturedImageUpload.tsx
"use client";

import { UploadButton } from "@uploadthing/react";
import type { MediaRouter } from "@/app/api/uploadthing/core";
import { useToast } from "@/components/ui";
import { normalizeFilesForUpload } from "@/lib/media/normalizeImageForUpload";
import { toCleanImageUrl } from "@/lib/media/toCleanImageUrl";

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
      onBeforeUploadBegin={(files) => normalizeFilesForUpload(files)}
      onClientUploadComplete={async (res) => {
        console.log("CLIENT UPLOAD DONE", res);
        const file = res?.[0];
        const savedUrl = file?.serverData?.url || file?.ufsUrl;

        // ✅ Safety checks
        if (!file || !savedUrl) {
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
              file_url: savedUrl,
              file_type: file.type,
              size: file.size,
            }),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data?.error || "Failed to save media");
          }

          onUpload(data.mediaId, toCleanImageUrl(savedUrl, file.name));

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
