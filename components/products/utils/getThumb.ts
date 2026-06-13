// apps/admin/components/products/utils/getThumb.ts


export function getThumb(url: string, size = 300) {
  if (!url) return "/placeholder.png";

  // already external image
  if (url.startsWith("http")) {
    return `${url}?w=${size}&h=${size}&fit=crop`;
  }

  // media id or local file
  return url;
}