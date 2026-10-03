import { AUTH_CHANGED_EVENT } from "../auth/auth-session";
import { previewKind, visualBlob, type PreviewFile } from "./preview-service";

const MAX_CACHE_BYTES = 12 * 1024 * 1024;
const MAX_CACHE_ITEMS = 150;
const cache = new Map<string, string>();
const pending = new Map<string, Promise<string>>();
let cacheBytes = 0;
let generation = 0;

export function thumbnailKey(file: PreviewFile): string {
  return `${file.relativePath}\0${file.size ?? ""}\0${file.lastModified ?? ""}`;
}

export function cachedThumbnail(file: PreviewFile): string | undefined {
  return cache.get(thumbnailKey(file));
}

function remember(key: string, url: string): void {
  const bytes = url.length * 2;
  if (bytes > MAX_CACHE_BYTES) return;
  while ((cacheBytes + bytes > MAX_CACHE_BYTES || cache.size >= MAX_CACHE_ITEMS) && cache.size) {
    const oldest = cache.keys().next().value!;
    cacheBytes -= cache.get(oldest)!.length * 2;
    cache.delete(oldest);
  }
  cache.set(key, url);
  cacheBytes += bytes;
}

function canvasThumbnail(source: CanvasImageSource, width: number, height: number): string {
  if (width <= 0 || height <= 0) throw new Error("Image dimensions are unavailable.");
  const scale = Math.min(180 / width, 180 / height, 1);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas is unavailable.");
  context.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/webp", 0.8);
}

async function imageThumbnail(blob: Blob): Promise<string> {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(blob);
      try { return canvasThumbnail(bitmap, bitmap.width, bitmap.height); }
      finally { bitmap.close(); }
    } catch { /* Some supported image formats need the browser image decoder. */ }
  }
  const source = URL.createObjectURL(blob);
  try {
    const image = new Image();
    image.src = source;
    await image.decode();
    return canvasThumbnail(image, image.naturalWidth, image.naturalHeight);
  } finally { URL.revokeObjectURL(source); }
}

export function loadThumbnail(file: PreviewFile): Promise<string> {
  const key = thumbnailKey(file);
  const existing = cache.get(key);
  if (existing) {
    cache.delete(key);
    cache.set(key, existing);
    return Promise.resolve(existing);
  }
  const inFlight = pending.get(key);
  if (inFlight) return inFlight;
  const currentGeneration = generation;
  const work = (async () => {
    const blob = await visualBlob(file);
    const url = previewKind(file.name) === "pdf"
      ? await (await import("./pdf-thumbnail")).pdfThumbnail(blob)
      : await imageThumbnail(blob);
    if (currentGeneration !== generation) throw new Error("The account changed during thumbnail loading.");
    remember(key, url);
    return url;
  })().finally(() => { if (pending.get(key) === work) pending.delete(key); });
  pending.set(key, work);
  return work;
}

function clearThumbnailCache(): void {
  generation++;
  cache.clear();
  pending.clear();
  cacheBytes = 0;
}

window.addEventListener(AUTH_CHANGED_EVENT, clearThumbnailCache);
window.addEventListener("pocketspace:upload-complete", clearThumbnailCache);
