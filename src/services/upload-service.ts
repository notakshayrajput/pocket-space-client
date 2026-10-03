import { clearSession, readSession } from "../auth/auth-session";

const baseUrl = import.meta.env.VITE_API_BASE_URL || "/api";

function errorMessage(body: string, status: number): string {
  try {
    const result = JSON.parse(body) as { message?: string; detail?: string; title?: string; errors?: Record<string, string[]> };
    return result.message || result.detail || Object.values(result.errors ?? {}).flat().join(" ") || result.title || `Request failed (${status}).`;
  } catch {
    return body.trim().startsWith("<") ? `Request failed (${status}).` : body.trim() || `Request failed (${status}).`;
  }
}

export function transferRequest(
  path: string,
  body: Blob | string,
  token: string,
  signal: AbortSignal,
  onProgress: (loaded: number, total: number | null) => void,
): Promise<XMLHttpRequest> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const abort = () => xhr.abort();
    const finish = () => signal.removeEventListener("abort", abort);
    xhr.open("POST", `${baseUrl}${path}`);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    if (typeof body === "string") xhr.setRequestHeader("Content-Type", "application/json");
    xhr.responseType = "blob";
    if (path.startsWith("/upload/")) {
      xhr.upload.onprogress = event => onProgress(event.loaded, event.lengthComputable ? event.total : null);
    } else {
      xhr.onprogress = event => onProgress(event.loaded, event.lengthComputable ? event.total : null);
    }
    xhr.onload = async () => {
      finish();
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(xhr);
      } else {
        const responseText = await (xhr.response as Blob).text();
        if (xhr.status === 401 && readSession()?.accessToken === token) {
          clearSession();
          reject(new Error("Your session has expired. Sign in again."));
        } else {
          reject(new Error(errorMessage(responseText, xhr.status)));
        }
      }
    };
    xhr.onerror = () => { finish(); reject(new Error("Network error. Please try again.")); };
    xhr.onabort = () => { finish(); reject(new DOMException("Transfer cancelled", "AbortError")); };
    signal.addEventListener("abort", abort, { once: true });
    if (signal.aborted) abort();
    else xhr.send(body);
  });
}

export default class UploadService {
  public static uploadFile(file: File, destinationPath: string, token: string, signal: AbortSignal,
    onProgress: (loaded: number, total: number | null) => void): Promise<XMLHttpRequest> {
    const query = new URLSearchParams({ name: file.name, destinationPath: destinationPath || "." });
    return transferRequest(`/upload/stream?${query}`, file, token, signal, onProgress);
  }
}
