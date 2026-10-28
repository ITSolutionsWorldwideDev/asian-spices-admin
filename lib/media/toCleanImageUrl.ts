// lib/media/toCleanImageUrl.ts

/**
 * Rewrites UploadThing CDN URLs (`https://<appId>.ufs.sh/f/<id>` or `https://utfs.io/f/<id>`)
 * to our local `/product-images/<id>.<ext>` route so:
 *  1. Every image (both existing and newly uploaded) has a clean `.jpg`/`.png`/`.webp` extension in its URL path
 *  2. UploadThing's `x-robots-tag: noindex` header is stripped and replaced with `X-Robots-Tag: all`
 */
export function toCleanImageUrl(
  rawUrl?: string | null,
  fileName?: string | null,
  baseUrl = "",
): string {
  if (!rawUrl) return "";

  const ufsMatch = rawUrl.match(
    /^https?:\/\/(?:[a-z0-9-]+\.ufs\.sh|utfs\.io)\/f\/([^/?#]+)/i,
  );
  if (!ufsMatch) {
    return rawUrl;
  }

  const idOrFile = decodeURIComponent(ufsMatch[1]);
  const hasValidExt = /\.(jpg|jpeg|png|webp|gif|bmp|tiff?)$/i.test(idOrFile);

  let ext = ".jpg";
  if (!hasValidExt && fileName && fileName.includes(".")) {
    const rawExt = fileName.slice(fileName.lastIndexOf(".")).toLowerCase();
    if (rawExt === ".png" || rawExt === ".webp" || rawExt === ".gif") {
      ext = rawExt;
    }
  }

  const finalFile = hasValidExt ? idOrFile : `${idOrFile}${ext}`;
  const cleanBase = baseUrl.replace(/\/+$/, "");
  return `${cleanBase}/product-images/${encodeURIComponent(finalFile)}`;
}
