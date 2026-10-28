// lib/media/normalizeImageForUpload.ts

/**
 * Re-encodes uploaded images in the browser to standard RGB JPEG or PNG before
 * sending them to UploadThing so Google Merchant Center never encounters:
 *  - `.jfif` extensions
 *  - AVIF / HEIC / CMYK bytes disguised inside `.jpg` or `.jfif` files
 */
export async function normalizeImageFile(file: File): Promise<File> {
  if (!file.type.startsWith("image/") && !/\.(jfif|jpe?g|png|webp|avif)$/i.test(file.name)) {
    return file;
  }

  const baseName = file.name.replace(/\.[^.]+$/, "");
  const isPng = file.type === "image/png" || /\.png$/i.test(file.name);
  const targetMime = isPng ? "image/png" : "image/jpeg";
  const targetExt = isPng ? ".png" : ".jpg";
  const targetName = `${baseName}${targetExt}`;

  try {
    const bitmap = await loadImageElement(file);
    const width = bitmap.width;
    const height = bitmap.height;

    if (!width || !height) {
      return renameIfNeeded(file, targetName, targetMime);
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return renameIfNeeded(file, targetName, targetMime);
    }

    // Fill white background for JPEG so transparent pixels don't turn black
    if (targetMime === "image/jpeg") {
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, width, height);
    }

    ctx.drawImage(bitmap.source, 0, 0, width, height);
    bitmap.cleanup?.();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, targetMime, targetMime === "image/jpeg" ? 0.92 : undefined),
    );

    if (!blob) {
      return renameIfNeeded(file, targetName, targetMime);
    }

    return new File([blob], targetName, {
      type: targetMime,
      lastModified: Date.now(),
    });
  } catch {
    return renameIfNeeded(file, targetName, targetMime);
  }
}

export async function normalizeFilesForUpload(files: File[]): Promise<File[]> {
  return Promise.all(files.map(normalizeImageFile));
}

function renameIfNeeded(file: File, targetName: string, targetMime: string): File {
  if (file.name === targetName && file.type === targetMime) {
    return file;
  }
  return new File([file], targetName, {
    type: targetMime,
    lastModified: file.lastModified,
  });
}

async function loadImageElement(file: File): Promise<{
  source: CanvasImageSource;
  width: number;
  height: number;
  cleanup?: () => void;
}> {
  if (typeof createImageBitmap === "function") {
    const bmp = await createImageBitmap(file);
    return {
      source: bmp,
      width: bmp.width,
      height: bmp.height,
      cleanup: () => bmp.close(),
    };
  }

  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve({
        source: img,
        width: img.naturalWidth,
        height: img.naturalHeight,
        cleanup: () => URL.revokeObjectURL(objectUrl),
      });
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(objectUrl);
      reject(err);
    };
    img.src = objectUrl;
  });
}
