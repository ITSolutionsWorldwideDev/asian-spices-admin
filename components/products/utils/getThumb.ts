// components/products/utils/getThumb.ts

import { toCleanImageUrl } from "@/lib/media/toCleanImageUrl";

export function getThumb(url: string, _size = 300) {
  if (!url) return "/assets/img/icons/image.svg";

  return toCleanImageUrl(url);
}
