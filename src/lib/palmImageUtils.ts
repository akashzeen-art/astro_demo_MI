const MAX_DIMENSION = 1920;
const IOS_MAX_DIMENSION = 1536;
const JPEG_QUALITY = 0.88;
const MAX_BYTES = 9 * 1024 * 1024;

function isIos(): boolean {
  return typeof navigator !== "undefined" && /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function isHeicLike(file: File): boolean {
  return /heic|heif/i.test(file.type) || /\.heic$|\.heif$/i.test(file.name);
}

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not decode image"));
    };
    img.src = url;
  });
}

async function rasterizeFile(
  file: File,
): Promise<{ source: CanvasImageSource; width: number; height: number; cleanup?: () => void }> {
  // iOS camera/gallery often returns HEIC — createImageBitmap cannot decode it; use <img> instead.
  if (!isHeicLike(file)) {
    const bitmap = await createImageBitmap(file).catch(() => null);
    if (bitmap) {
      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        cleanup: () => bitmap.close(),
      };
    }
  }

  const img = await loadImageFromFile(file);
  if (!img.naturalWidth || !img.naturalHeight) {
    throw new Error("Could not read image dimensions.");
  }
  return {
    source: img,
    width: img.naturalWidth,
    height: img.naturalHeight,
  };
}

function canvasToJpeg(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob(resolve, "image/jpeg", quality);
  });
}

/**
 * Resize and convert palm photos to JPEG so mobile cameras (Android/iOS)
 * upload reliably and previews render in all browsers.
 */
export async function preparePalmImageForUpload(file: File): Promise<File> {
  const maxDim = isIos() ? IOS_MAX_DIMENSION : MAX_DIMENSION;

  if (file.type === "image/jpeg" && !isHeicLike(file) && file.size <= 4 * 1024 * 1024) {
    return file;
  }

  let cleanup: (() => void) | undefined;

  try {
    const { source, width, height, cleanup: release } = await rasterizeFile(file);
    cleanup = release;

    const scale = Math.min(1, maxDim / Math.max(width, height, 1));
    const outW = Math.max(1, Math.round(width * scale));
    const outH = Math.max(1, Math.round(height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Could not process image.");
    }
    ctx.drawImage(source, 0, 0, outW, outH);

    let quality = JPEG_QUALITY;
    let blob = await canvasToJpeg(canvas, quality);
    while (blob && blob.size > MAX_BYTES && quality > 0.5) {
      quality -= 0.08;
      blob = await canvasToJpeg(canvas, quality);
    }

    if (!blob) {
      throw new Error("Could not process image.");
    }

    const baseName = file.name.replace(/\.[^.]+$/, "") || "palm";
    return new File([blob], `${baseName}.jpg`, {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  } catch {
    if (
      !isHeicLike(file) &&
      (file.type === "image/jpeg" || file.type === "image/png" || !file.type) &&
      file.size <= MAX_BYTES
    ) {
      return file;
    }
    throw new Error(
      isIos()
        ? "Could not process this iPhone photo. Try the in-browser camera or pick a JPG from your gallery."
        : "Could not read this photo. Please take a new picture or choose a JPG/PNG from your gallery.",
    );
  } finally {
    cleanup?.();
  }
}

export function isIosDevice(): boolean {
  return isIos();
}
