// apps/admin/components/products/tabs/ProductImagesTab.tsx

"use client";

import Image from "next/image";
import { getThumb } from "../utils/getThumb";
import { useState } from "react";

interface Props {
  media: any[];
  selectedMedia: number[];
  primaryMedia: number | null;
  setSelectedMedia: React.Dispatch<React.SetStateAction<number[]>>;
  setPrimaryMedia: React.Dispatch<React.SetStateAction<number | null>>;
  mode: string;
  page: number;
  totalPages: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;

  mediaSearch: string;
  setMediaSearch: React.Dispatch<React.SetStateAction<string>>;
}

export default function ProductImagesTab({
  media,
  selectedMedia,
  primaryMedia,
  setSelectedMedia,
  setPrimaryMedia,
  mode,
  page,
  totalPages,
  setPage,
  mediaSearch,
  setMediaSearch,
}: Props) {
  const formatFileName = (name: string) => {
    let cleaned = name.split("-").slice(1).join("-");
    if (!cleaned) cleaned = name; // Guard variant if name doesn't contain tokens
    cleaned = cleaned.replace(/_/g, " ");
    return cleaned.length > 30 ? cleaned.slice(0, 30) + "..." : cleaned;
  };

  const [searchInput, setSearchInput] = useState("");

  return (
    <>
      {/* <div className="mb-4">
        <input
          type="text"
          placeholder="Search media files..."
          value={mediaSearch}
          onChange={(e) => setMediaSearch(e.target.value)}
          className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
        />
      </div> */}

      <div className="mb-4 flex gap-2">
        <input
          type="text"
          value={mediaSearch}
          placeholder="Search media..."
          onChange={(e) => setMediaSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
            }
          }}
          // className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm"
          className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
        />

        <button
          type="button"
          onClick={() => {}}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Search
        </button>
      </div>
      <div className="grid grid-cols-4 gap-4">
        {media.map((item) => {
          const displayName = formatFileName(item.file_name);

          const selected = selectedMedia.includes(item.media_id);

          const primary = primaryMedia === item.media_id;

          return (
            <div
              key={item.media_id}
              className={`border rounded p-2 cursor-pointer ${
                selected ? "ring-2 ring-blue-500" : ""
              }`}
              onClick={() => {
                if (mode !== "create" && mode !== "edit") return;

                if (selected) {
                  const updated = selectedMedia.filter(
                    (x) => x !== item.media_id,
                  );

                  setSelectedMedia(updated);

                  if (primaryMedia === item.media_id) {
                    setPrimaryMedia(updated[0] ?? null);
                  }
                } else {
                  setSelectedMedia((prev) => [...prev, item.media_id]);

                  if (!primaryMedia) {
                    setPrimaryMedia(item.media_id);
                  }
                }
              }}
              //   onClick={() => {
              //     if (mode !== "create" && mode !== "edit") return;

              //     setSelectedMedia((prev) =>
              //       selected
              //         ? prev.filter((x) => x !== item.media_id)
              //         : [...prev, item.media_id],
              //     );

              //     if (!primaryMedia) {
              //       setPrimaryMedia(item.media_id);
              //     }
              //   }}
            >
              <Image
                src={getThumb(item.file_url)}
                alt={item.file_name}
                width={250}
                height={250}
                className="w-full rounded"
              />

              {/* Metadata labels row */}
              <p className="mt-2 text-xs font-medium text-gray-700 truncate px-0.5">
                {displayName}
              </p>

              {selected && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPrimaryMedia(item.media_id);
                  }}
                  className="mt-2 w-full rounded bg-gray-100 px-2 py-1 text-xs"
                >
                  Set Primary
                </button>
              )}

              {primary && (
                <div className="mt-2 text-xs text-blue-600 font-semibold">
                  Primary
                </div>
              )}
            </div>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-between mt-6">
          <button
            type="button"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </button>

          <span>
            {page} / {totalPages}
          </span>

          <button
            type="button"
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      )}
    </>
  );
}
