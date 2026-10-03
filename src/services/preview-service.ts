import { AUTH_CHANGED_EVENT, readSession } from "../auth/auth-session";

export type PreviewKind = "image" | "pdf" | "text" | "rtf" | "docx" | "unsupported";
export interface PreviewFile { name: string; relativePath: string; size?: number; lastModified?: string }

export function previewKind(name: string): PreviewKind {
  const extension = name.slice(name.lastIndexOf(".")).toLowerCase();
  if ([".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp", ".avif"].includes(extension)) return "image";
  if (extension === ".pdf") return "pdf";
  if (extension === ".rtf") return "rtf";
  if (extension === ".docx") return "docx";
  if ([".txt", ".md", ".markdown", ".csv", ".tsv", ".log", ".json", ".xml",
    ".yaml", ".yml", ".ini", ".html", ".htm", ".css", ".js", ".ts", ".jsx", ".tsx"].includes(extension)) return "text";
  return "unsupported";
}

export function thumbnailAllowed(file: PreviewFile): boolean {
  const kind = previewKind(file.name);
  return (kind === "image" || kind === "pdf") && (file.size ?? 0) <= 8 * 1024 * 1024;
}

export const previewRoute = (path: string) => `/preview?path=${encodeURIComponent(path)}`;

export function openPreviewTab(path: string): void {
  // A same-origin child initially receives a copy of sessionStorage, which holds
  // this app's login. Clear opener immediately after creating the tab.
  const tab = window.open(previewRoute(path), "_blank");
  if (tab) tab.opener = null;
}

const baseUrl = import.meta.env.VITE_API_BASE_URL || "/api";
const visualCache = new Map<string, Blob>();
const inFlight = new Map<string, Promise<Blob>>();
let cacheBytes = 0;
let generation = 0;
let active = 0;
const waiting: Array<() => void> = [];

function schedule<T>(action: () => Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const run = () => {
      active++;
      void action().then(resolve, reject).finally(() => {
        active--;
        waiting.shift()?.();
      });
    };
    if (active < 3) run();
    else waiting.push(run);
  });
}

async function authorizedFetch(path: string, signal?: AbortSignal): Promise<Response> {
  const token = readSession()?.accessToken;
  if (!token) throw new Error("Sign in to preview files.");
  const response = await fetch(`${baseUrl}${path}`, {
    headers: { Authorization: `Bearer ${token}` }, signal, cache: "no-store",
  });
  if (!response.ok) {
    let message = `Preview failed (${response.status}).`;
    try { message = (await response.json() as { message?: string }).message || message; } catch { /* Keep status. */ }
    throw new Error(message);
  }
  return response;
}

export function visualBlob(file: PreviewFile): Promise<Blob> {
  const key = `${file.relativePath}\0${file.size ?? ""}\0${file.lastModified ?? ""}`;
  const cached = visualCache.get(key);
  if (cached) return Promise.resolve(cached);
  const pending = inFlight.get(key);
  if (pending) return pending;
  const currentGeneration = generation;
  const work = schedule(async () => {
    if (currentGeneration !== generation) throw new Error("The account changed during preview.");
    const response = await authorizedFetch(`/space/preview/content?path=${encodeURIComponent(file.relativePath)}`);
    const blob = await response.blob();
    if (currentGeneration !== generation) throw new Error("The account changed during preview.");
    if (blob.size <= 8 * 1024 * 1024) {
      while (cacheBytes + blob.size > 32 * 1024 * 1024 && visualCache.size) {
        const oldest = visualCache.keys().next().value!;
        cacheBytes -= visualCache.get(oldest)!.size;
        visualCache.delete(oldest);
      }
      visualCache.set(key, blob);
      cacheBytes += blob.size;
    }
    return blob;
  }).finally(() => { if (inFlight.get(key) === work) inFlight.delete(key); });
  inFlight.set(key, work);
  return work;
}

export async function previewText(file: PreviewFile, signal?: AbortSignal): Promise<{ text: string; truncated: boolean }> {
  const response = await authorizedFetch(`/space/preview/text?path=${encodeURIComponent(file.relativePath)}`, signal);
  return await response.json() as { text: string; truncated: boolean };
}

function clearPreviewCache() {
  generation++;
  visualCache.clear();
  inFlight.clear();
  cacheBytes = 0;
}

window.addEventListener(AUTH_CHANGED_EVENT, clearPreviewCache);
window.addEventListener("pocketspace:upload-complete", clearPreviewCache);
