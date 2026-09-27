import FileService from "./file-service";
import { notifyUnreportedRequestError } from "./request-notifications";
export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}
// utils/util.ts


export async function downloadFile(paths: string[]): Promise<void> {
  try {
    const response = await FileService.downloadFiles(paths);

    if (!response.ok) throw new Error(`Failed to download: ${response.statusText}`);

    const disposition = response.headers.get("Content-Disposition");
    let fileName = "download.zip";

    if (disposition) {
      const filenameRegex = /filename\*?=(?:"([^"]*)"|([^;]*))/;
      const matches = disposition.match(filenameRegex);
      if (matches) fileName = matches[1] || decodeURIComponent(matches[2]);
    }

    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    try {
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = fileName;
      a.click();
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  } catch (error) {
    notifyUnreportedRequestError("POST", "/download", { paths }, error);
    throw error;
  }
}
