// app/(admin)/media/page.tsx

"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useToast } from "@/core/ui";

import { UploadButton, UploadDropzone } from "@uploadthing/react";
import type { MediaRouter } from "@/app/api/uploadthing/core";

interface MediaItem {
  media_id: number;
  file_name: string;
  file_url: string;
  file_type: string;
  created_at: string;
}
interface PaginationMeta {
  page: number;
  limit: number;
  totalRecords: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export default function MediaLibrary() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<number[]>([]);

  // 🚀 New Pagination State Drivers
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 12,
    totalRecords: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const { showToast } = useToast();
  const limitPerPage = 12;

  const fetchMedia = async (targetPage = currentPage) => {
    try {
      setLoading(true);
      const res = await fetch(
        `/api/media?page=${targetPage}&limit=${limitPerPage}`,
      );
      if (!res.ok) throw new Error();
      const data = await res.json();

      setMedia(data.media || []);
      if (data.pagination) {
        setPagination(data.pagination);
      }
    } catch {
      showToast("error", "Failed to load Media assets");
    } finally {
      setLoading(false);
    }
  };

  // Re-trigger network query whenever page coordinates mutate
  useEffect(() => {
    fetchMedia(currentPage);
  }, [currentPage]);

  const toggleSelect = (id: number) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleDelete = async (ids: number[] | number) => {
    const list = Array.isArray(ids) ? ids : [ids];

    if (
      !confirm(`Permanently remove ${list.length} file(s) from asset tracking?`)
    )
      return;

    try {
      setLoading(true);
      await Promise.all(
        list.map((id) => fetch(`/api/media?id=${id}`, { method: "DELETE" })),
      );

      setSelected([]);
      showToast("success", "Deleted files successfully");

      // Safety calculation: if we delete the last elements on the current page, slide back safely
      const remainingOnPage = media.length - list.length;
      if (remainingOnPage <= 0 && currentPage > 1) {
        setCurrentPage((prev) => prev - 1);
      } else {
        fetchMedia(currentPage);
      }
    } catch {
      showToast("error", "Failed processing file removal commands");
    } finally {
      setLoading(false);
    }
  };

  const formatFileName = (name: string) => {
    let cleaned = name.split("-").slice(1).join("-");
    if (!cleaned) cleaned = name; // Guard variant if name doesn't contain tokens
    cleaned = cleaned.replace(/_/g, " ");
    return cleaned.length > 30 ? cleaned.slice(0, 30) + "..." : cleaned;
  };

  return (
    <div className="page-wrapper">
      <div className="content max-w-6xl mx-auto space-y-6">
        {/* Header Title Section */}
        <div className="flex justify-between items-baseline flex-wrap gap-2">
          <div>
            <h4 className="text-xl font-semibold text-gray-900">
              Media Library
            </h4>
            <p className="text-sm text-gray-500">
              Upload and manage product catalog assets
            </p>
          </div>
          <span className="text-xs font-medium text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
            Total Files: {pagination.totalRecords}
          </span>
        </div>

        {/* DROPZONE (NEW UX) */}
        <div className="mb-6 rounded-xl border border-gray-200 bg-gray-50 p-4">
          <UploadDropzone<MediaRouter, "productImage">
            endpoint="productImage"
            // 1. Keep the root layout neutral so it doesn't break internal visibility layers
            className="border border-dashed border-gray-300 rounded-xl transition duration-200 hover:border-blue-500"
            // 2. Use the appearance prop to safely inject styling without overlapping layers
            appearance={{
              container: {
                backgroundColor: "#ffffff", // Pure white grid layout background safely applied
                padding: "24px",
              },
              button: {
                backgroundColor: "#f97316", // Your corporate brand orange background (ut-button:bg-orange-500 equivalent)
                fontSize: "0.875rem",
                fontWeight: "600",
                padding: "8px 24px",
                borderRadius: "0.5rem",
              },
              label: {
                color: "#4b5563", // Gray text for structural readability
              },
              allowedContent: {
                color: "#9ca3af", // Subtle gray info text labels
              },
            }}
            // className="rounded-lg border border-dashed border-gray-300 px-6 py-6 bg-red-500 hover:border-blue-500 hover:bg-red-200 text-white transition duration-200 "
            // className="rounded-lg border border-dashed border-gray-300 px-6 py-4 bg-white hover:border-blue-500 hover:bg-gray-50/50 transition duration-200 ut-button:bg-orange-500 ut-button:hover:bg-orange-600 ut-label:text-gray-600 ut-allowed-content:text-gray-400"
            // className="rounded-lg border border-dashed border-gray-300 px-6 py-4 hover:border-primary bg-orange-500 hover:bg-orange-600 text-white "

            // 🏷️ Dynamic text adjustments to display file names
            content={{
              label({ ready, isUploading, files }) {
                if (isUploading)
                  return (
                    <span className="text-orange-500 font-medium animate-pulse">
                      Uploading files...
                    </span>
                  );
                if (files.length > 0) {
                  return (
                    <div className="flex flex-col items-center gap-1.5 w-full max-w-md my-2">
                      <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full">
                        Ready to upload ({files.length} selected):
                      </span>
                      <ul className="text-xs text-gray-500 space-y-0.5 max-h-24 overflow-y-auto w-full text-center divide-y divide-gray-100">
                        {files.map((f) => (
                          <li
                            key={f.name}
                            className="truncate py-1 px-2 font-mono bg-gray-50 rounded border border-gray-100"
                          >
                            {f.name} ({(f.size / 1024 / 1024).toFixed(2)} MB)
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                }
                return "Choose files or drag and drop here";
              },
            }}
            // 🚀 Monitor the exact moment the handoff begins
            onUploadBegin={(files) => {
              console.log("🚀 Uploading initialized for files:", files);
            }}
            onClientUploadComplete={async (res) => {
              console.log("productImage res === ", res);
              if (!res?.length) return;

              try {
                await Promise.all(
                  res.map((file) =>
                    fetch("/api/media/save", {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({
                        file_name: file.name,
                        file_url: file.ufsUrl,
                        file_type: file.type,
                        size: file.size,
                      }),
                    }),
                  ),
                );

                showToast("success", "Files uploaded successfully");
                setCurrentPage(1); // Reset directly back to page 1 to showcase new content injections
                fetchMedia(1);
                // fetchMedia();
              } catch (err: any) {
                console.log("productImage err === ", err);
                showToast(
                  "error",
                  err.message || "Failed linking files downstream",
                );
              }
            }}
            onUploadError={(err) => {
              console.log("onUploadError res === ", err);
              showToast("error", err.message);
            }}
          />
        </div>

        {/* Bulk actions */}
        {/* Multi-Selection Contextual Toolbar Area */}
        {selected.length > 0 && (
          <div className="flex gap-2 items-center bg-blue-50 border border-blue-200 p-3 rounded-lg animate-fadeIn">
            <span className="text-xs font-semibold text-blue-700 mr-2">
              Selected {selected.length} asset elements
            </span>
            <button
              onClick={() => handleDelete(selected)}
              className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-xs transition"
            >
              Delete Selected
            </button>
            <button
              onClick={() => setSelected([])}
              className="border border-gray-300 hover:bg-white text-gray-700 text-xs font-medium px-3 py-1.5 rounded-lg bg-gray-50 transition"
            >
              Clear Selection
            </button>
          </div>
        )}

        {/* ASSET ELEMENT PRESENTATION GRID */}
        {loading && media.length === 0 ? (
          <p className="text-center text-sm text-gray-500 py-12">
            Loading media assets...
          </p>
        ) : media.length === 0 ? (
          <div className="p-16 border rounded-xl border-dashed text-center text-gray-400 text-sm font-medium bg-white">
            No library assets found inside this page directory. Upload files
            above to begin tracking data.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {media.map((item) => {
              const displayName = formatFileName(item.file_name);
              const isSelected = selected.includes(item.media_id);

              return (
                <div
                  key={item.media_id}
                  onClick={() => toggleSelect(item.media_id)}
                  className={`group relative cursor-pointer rounded-xl border bg-white p-2.5 transition select-none
                    ${isSelected ? "ring-2 ring-blue-500 border-transparent shadow-sm" : "border-gray-200 hover:shadow-md hover:border-gray-300"}
                  `}
                >
                  {/* Thumbnail Frame Content Block */}
                  <div className="relative h-32 w-full overflow-hidden rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center">
                    {item.file_type.startsWith("image/") ? (
                      <Image
                        src={item.file_url}
                        alt={item.file_name}
                        fill
                        sizes="(max-width: 768px) 50vw, 25vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="p-4 text-center text-[10px] font-mono text-gray-400 break-all bg-gray-100 w-full h-full flex items-center justify-center">
                        {displayName}
                      </div>
                    )}
                  </div>

                  {/* Metadata labels row */}
                  <p className="mt-2 text-xs font-medium text-gray-700 truncate px-0.5">
                    {displayName}
                  </p>

                  {/* Absolute Target Singleton Deletion Action Hook */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // Restrict container bubble events from selecting items
                      handleDelete(item.media_id);
                    }}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center shadow-md transition-opacity duration-200"
                    title="Delete item"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* 🚀 INTERACTIVE PAGINATION CONTROLS BOTTOM BLOCK */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 pt-4 mt-8">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={!pagination.hasPrevPage || loading}
              className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-white transition"
            >
              ← Previous
            </button>

            <span className="text-xs font-medium text-gray-600">
              Page {currentPage} of {pagination.totalPages}
            </span>

            <button
              onClick={() =>
                setCurrentPage((p) => Math.min(p + 1, pagination.totalPages))
              }
              disabled={!pagination.hasNextPage || loading}
              className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-white transition"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

{
  /* {selected.length > 0 && (
          <div className="mb-4 flex gap-3">
            <button
              onClick={() => handleDelete(selected)}
              className="bg-red-500 text-white px-4 py-2 rounded"
            >
              Delete Selected ({selected.length})
            </button>

            <button
              onClick={() => setSelected([])}
              className="bg-gray-200 px-4 py-2 rounded"
            >
              Clear
            </button>
          </div>
        )} */
}
/* const handleDelete = async (ids: number[] | number) => {
    const list = Array.isArray(ids) ? ids : [ids];

    // if (!confirm(`Delete ${list.length} file(s)?`)) return;
    if (!confirm(`Permanently remove ${list.length} file(s) from asset tracking?`)) return;

    await Promise.all(
      list.map((id) => fetch(`/api/media?id=${id}`, { method: "DELETE" })),
    );

    setSelected([]);
    fetchMedia();
    showToast("success", "Deleted successfully");
  };

  const formatFileName = (name: string) => {
    let cleaned = name.split("-").slice(1).join("-");
    cleaned = cleaned.replace(/_/g, " ");
    return cleaned.length > 40 ? cleaned.slice(0, 40) + "..." : cleaned;
  }; */

{
  /* GRID */
}
{
  /* <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {media.map((item) => {
            const displayName = formatFileName(item.file_name);
            const isSelected = selected.includes(item.media_id);

            return (
              <div
                key={item.media_id}
                onClick={() => toggleSelect(item.media_id)}
                className={`relative cursor-pointer rounded border p-2 transition
                  ${isSelected ? "ring-2 ring-blue-500" : "hover:shadow-md"}
                `}
              >
            
                {item.file_type.startsWith("image/") ? (
                  <Image
                    src={item.file_url}
                    alt={item.file_name}
                    width={200}
                    height={200}
                    className="h-32 w-full object-cover rounded"
                  />
                ) : (
                  <div className="h-32 flex items-center justify-center text-xs bg-gray-100">
                    {displayName}
                  </div>
                )}

             
                <p className="mt-1 text-xs text-gray-600 truncate">
                  {displayName}
                </p>

       
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(item.media_id);
                  }}
                  className="absolute top-1 right-1 bg-red-500 text-white text-xs px-2 py-1 rounded"
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div> */
}

{
  /* loading */
}
{
  /* {loading && (
          <p className="text-center mt-4 text-gray-500">Loading media...</p>
        )} */
}

/* "use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useToast } from "@/core/ui";

import { UploadButton, UploadDropzone } from "@uploadthing/react";
import type { MediaRouter } from "@/app/api/uploadthing/core";

interface MediaItem {
  media_id: number;
  file_name: string;
  file_url: string;
  file_type: string;
  created_at: string;
}

export function getThumb(url: string, size = 300) {
  return `${url}?w=${size}&h=${size}&fit=crop`;
}

export default function MediaLibrary() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const fetchMedia = async () => {
    try {
      const res = await fetch("/api/media");
      const data = await res.json();
      setMedia(data);
    } catch {
      showToast("error", "Failed to load Media");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this image?")) return;

    await fetch(`/api/media?id=${id}`, {
      method: "DELETE",
    });
    await fetchMedia();
  };

  const formatFileName = (name: string) => {
    // remove prefix before first hyphen
    let cleaned = name.split("-").slice(1).join("-");

    // remove underscores
    cleaned = cleaned.replace(/_/g, " ");

    // limit to 50 chars
    if (cleaned.length > 50) {
      cleaned = cleaned.slice(0, 50) + "...";
    }

    return cleaned;
  };

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          <div className="page-header flex flex-rows md:flex-col justify-between items-center mb-4">
            <div className=" w-full">
              <h4 className="text-lg font-semibold">Media Library</h4>
              <h6 className="text-gray-500">Manage your media</h6>
            </div>
            <div className="p-6 card table-list-card  w-full">
              <div className="card-body bg-gray-100">

                <div className="mb-4">
                  <UploadButton<MediaRouter, "productImage">
                    endpoint="productImage"
                    className="rounded border border-dashed border-gray-400 px-6 py-3 hover:border-primary "
                    onClientUploadComplete={async (res) => {
                      console.log("CLIENT UPLOAD DONE", res);
                      const file = res?.[0];

                      // ✅ Safety checks
                      if (!file || !file.ufsUrl) {
                        showToast(
                          "error",
                          "Upload failed: invalid file response",
                        );
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
                          throw new Error(
                            data?.error || "Failed to save media",
                          );
                        }

                        console.log("DB SAVED ✅", data);

                        // ✅ SINGLE success message
                        showToast("success", "Upload + Save successful ✅");

                        // ✅ SINGLE refresh
                        fetchMedia();
                      } catch (err: any) {
                        console.error("SAVE ERROR ❌", err);
                        showToast(
                          "error",
                          err.message || "Something went wrong",
                        );
                      }
                    }}
                    onUploadError={(err: any) => {
                      showToast("error", err.message);
                    }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols- p-4">
                  {media.map((item) => {
                    const displayName = formatFileName(item.file_name);

                    return (
                      <div
                        key={item.media_id}
                        className="relative rounded border bg-gray-50 p-2 hover:shadow-md"
                      >
                        {item.file_type.startsWith("image/") ? (
                          <Image
                            // src={getThumb(item.file_url, 200)}
                            src={item.file_url}
                            alt={item.file_name}
                            width={200}
                            height={200}
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex aspect-square items-center justify-center wrap-break-word bg-gray-200 p-2 text-center text-xs text-gray-700">
                            {item.file_type} <br />
                            {displayName}
                          </div>
                        )}

                        <button
                          onClick={() => handleDelete(item.media_id)}
                          className="absolute right-1 top-1 rounded bg-red-500 px-2 py-1 text-xs text-white"
                        >
                          Delete
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} */

/* const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
        showToast("error", "Max file size is 5MB");
        return;
    }

    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("module_ref", "blogs");

    const res = await fetch("/api/media", {
      method: "POST",
      body: formData,
    });

    if (res.ok) {
        await fetchMedia();
    } else {
        showToast("error", "Upload failed");
    }

    setUploading(false);
  }; */
{
  /* <Image
                  src={item.file_path}
                  alt={item.file_name}
                  width={200}
                  height={200}
                  className="aspect-square w-full rounded object-cover"
                /> */
}
