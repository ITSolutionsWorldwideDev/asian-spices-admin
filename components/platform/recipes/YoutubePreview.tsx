// components/platform/recipes/YoutubePreview.tsx

"use client";

import { useMemo } from "react";

function extractYoutubeId(url: string) {
  if (!url) return null;

  try {
    const parsed = new URL(url);

    // youtube.com/watch?v=
    if (parsed.hostname.includes("youtube.com")) {
      return parsed.searchParams.get("v");
    }

    // youtu.be/
    if (parsed.hostname.includes("youtu.be")) {
      return parsed.pathname.replace("/", "");
    }

    return null;
  } catch {
    return null;
  }
}

export default function YoutubePreview({ url }: { url: string }) {
  const videoId = useMemo(() => extractYoutubeId(url), [url]);

  if (!url) {
    return (
      <div className="border border-dashed rounded-lg p-6 text-center text-sm text-gray-500">
        Paste a YouTube URL to preview video
      </div>
    );
  }

  if (!videoId) {
    return (
      <div className="border border-red-200 bg-red-50 rounded-lg p-4 text-sm text-red-600">
        Invalid YouTube URL
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="aspect-video overflow-hidden rounded-xl border bg-black">
        <iframe
          src={`https://www.youtube.com/embed/${videoId}`}
          title="Youtube Preview"
          className="w-full h-full"
          allowFullScreen
        />
      </div>

      <div className="flex items-center gap-3">
        <img
          src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`}
          alt="Thumbnail"
          className="w-28 h-16 object-cover rounded-md border"
        />

        <div className="flex-1">
          <p className="text-xs text-gray-500 mb-1">Video ID</p>

          <p className="font-mono text-sm break-all">{videoId}</p>
        </div>
      </div>
    </div>
  );
}
