// components/media/FeaturedImageUpload.tsx
"use client";

import { useState } from "react";
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
  const [uploading, setUploading] = useState(false);

  return (
    <>
      {uploading && (
        <div
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-3 bg-black/50"
          aria-busy="true"
          aria-live="assertive"
        >
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-white border-t-transparent" />
          <p className="text-sm font-semibold text-white">Uploading image…</p>
          <p className="text-xs text-white/80">Please wait — do not leave this page</p>
        </div>
      )}

      <UploadButton<MediaRouter, "productImage">
        endpoint="productImage"
        className="rounded border border-dashed border-gray-400 px-6 py-3 hover:border-primary "
        onBeforeUploadBegin={async (files) => {
          setUploading(true);
          try {
            return await normalizeFilesForUpload(files);
          } catch (err) {
            setUploading(false);
            throw err;
          }
        }}
        onClientUploadComplete={async (res) => {
          try {
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
          } finally {
            setUploading(false);
          }
        }}
        onUploadError={(err) => {
          setUploading(false);
          showToast("error", err.message);
        }}
      />
    </>
  );
}
