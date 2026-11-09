// app/product-images/[filename]/route.ts

import { NextRequest, NextResponse } from "next/server";

function cleanEnv(v?: string) {
  return (v || "").replace(/^['"]|['"];?$/g, "").trim();
}

function getUfsBase(): string {
  const fromEnv = cleanEnv(process.env.UFS_BASE);
  if (fromEnv) return fromEnv.replace(/\/+$/, "");

  const appId = cleanEnv(process.env.UPLOADTHING_APP_ID);
  if (appId) return `https://${appId}.ufs.sh/f`;

  throw new Error("UFS_BASE or UPLOADTHING_APP_ID must be set");
}

function getMimeTypeFromExt(ext: string): string {
  switch (ext.toLowerCase()) {
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "gif":
      return "image/gif";
    case "bmp":
      return "image/bmp";
    case "tiff":
    case "tif":
      return "image/tiff";
    case "jpg":
    case "jpeg":
    default:
      return "image/jpeg";
  }
}

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ filename: string }> },
) {
  const { filename } = await context.params;

  // Match `<keyOrCustomId>.<ext>`
  const match = filename.match(/^([A-Za-z0-9._-]+)\.(jpg|jpeg|png|webp|gif|bmp|tiff?)$/i);
  if (!match) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const [, baseKey, ext] = match;
  const ufsBase = getUfsBase();

  try {
    // 1. Try full filename first (matches new uploads where customId ends with .jpg/.png)
    let upstream = await fetch(`${ufsBase}/${encodeURIComponent(filename)}`, {
      next: { revalidate: 60 * 60 * 24 * 30 },
    });

    // 2. Fallback to key without extension (matches older uploads keyed by raw UploadThing key)
    if (!upstream.ok) {
      upstream = await fetch(`${ufsBase}/${encodeURIComponent(baseKey)}`, {
        next: { revalidate: 60 * 60 * 24 * 30 },
      });
    }

    if (!upstream.ok || !upstream.body) {
      return new NextResponse("Image not found", { status: upstream.status || 404 });
    }

    const contentType = getMimeTypeFromExt(ext);

    // Return a clean response that strips UploadThing's `x-robots-tag: noindex`
    return new NextResponse(upstream.body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Robots-Tag": "all",
      },
    });
  } catch {
    return new NextResponse("Failed to fetch image", { status: 502 });
  }
}
