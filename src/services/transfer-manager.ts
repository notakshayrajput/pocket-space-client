import { AUTH_CHANGED_EVENT, readSession } from "../auth/auth-session";
import { clearFileCache } from "../store/features/fileExplorer/fileExplorerSlice";
import { store } from "../store/store";
import UploadService, { transferRequest } from "./upload-service";

export type TransferStatus = "queued" | "active" | "completed" | "failed" | "cancelled";
export interface TransferItem {
  id: string;
  batchId: string;
  kind: "upload" | "download";
  name: string;
  status: TransferStatus;
  percent: number | null;
  loaded: number;
  total: number | null;
  error?: string;
}

type UploadJob = { itemId: string; file: File; destinationPath: string; token: string };
const terminal = (status: TransferStatus) => status === "completed" || status === "failed" || status === "cancelled";

class TransferManager {
  private items: TransferItem[] = [];
  private listeners = new Set<() => void>();
  private queue: UploadJob[] = [];
  private controllers = new Map<string, AbortController>();
  private runningUploads = false;
  private generation = 0;
  private warningAttached = false;
  private confirmLeave = (event: BeforeUnloadEvent) => {
    event.preventDefault();
    event.returnValue = "";
  };

  getSnapshot = (): readonly TransferItem[] => this.items;
  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };
  private publish(items: TransferItem[]) {
    this.items = items;
    const hasPending = items.some(item => item.status === "queued" || item.status === "active");
    if (hasPending !== this.warningAttached) {
      if (hasPending) window.addEventListener("beforeunload", this.confirmLeave);
      else window.removeEventListener("beforeunload", this.confirmLeave);
      this.warningAttached = hasPending;
    }
    this.listeners.forEach(listener => listener());
  }
  private update(id: string, patch: Partial<TransferItem>) {
    this.publish(this.items.map(item => item.id === id ? { ...item, ...patch } : item));
  }
  private get(id: string) { return this.items.find(item => item.id === id); }

  enqueueUploads(files: File[], destinationPath: string): void {
    if (!files.length) return;
    const token = readSession()?.accessToken;
    if (!token) throw new Error("Sign in before uploading files.");
    const batchId = crypto.randomUUID();
    const jobs = files.map(file => ({ itemId: crypto.randomUUID(), file, destinationPath, token }));
    this.queue.push(...jobs);
    this.publish([...this.items, ...jobs.map(job => ({
      id: job.itemId, batchId, kind: "upload" as const, name: job.file.name,
      status: "queued" as const, percent: 0, loaded: 0, total: job.file.size,
    }))]);
    void this.runUploads();
  }

  private async runUploads(): Promise<void> {
    if (this.runningUploads) return;
    this.runningUploads = true;
    try {
      while (this.queue.length) {
        const job = this.queue.shift()!;
        if (this.get(job.itemId)?.status !== "queued") continue;
        const generation = this.generation;
        const controller = new AbortController();
        this.controllers.set(job.itemId, controller);
        this.update(job.itemId, { status: "active" });
        try {
          await UploadService.uploadFile(job.file, job.destinationPath, job.token, controller.signal,
            (loaded, total) => {
              if (this.generation !== generation || this.get(job.itemId)?.status !== "active") return;
              this.update(job.itemId, { loaded, total, percent: total ? Math.min(100, Math.round(loaded / total * 100)) : null });
            });
          if (this.generation === generation && this.get(job.itemId)?.status === "active") {
            this.update(job.itemId, { status: "completed", percent: 100, loaded: job.file.size, total: job.file.size });
            store.dispatch(clearFileCache());
            window.dispatchEvent(new CustomEvent("pocketspace:upload-complete", { detail: job.destinationPath || "." }));
          }
        } catch (error) {
          if (this.generation === generation && this.get(job.itemId)?.status === "active")
            this.update(job.itemId, { status: controller.signal.aborted ? "cancelled" : "failed",
              error: controller.signal.aborted ? undefined : error instanceof Error ? error.message : "Upload failed." });
        } finally {
          this.controllers.delete(job.itemId);
        }
      }
    } finally {
      this.runningUploads = false;
      if (this.queue.length) void this.runUploads();
    }
  }

  enqueueDownload(paths: string[], name: string): void {
    if (!paths.length) return;
    const token = readSession()?.accessToken;
    if (!token) throw new Error("Sign in before downloading files.");
    const id = crypto.randomUUID();
    const controller = new AbortController();
    this.controllers.set(id, controller);
    this.publish([...this.items, { id, batchId: id, kind: "download", name, status: "active",
      percent: null, loaded: 0, total: null }]);
    const generation = this.generation;
    void (async () => {
      try {
        const xhr = await transferRequest("/download", JSON.stringify({ paths }), token, controller.signal,
          (loaded, total) => {
            if (this.generation !== generation || this.get(id)?.status !== "active") return;
            this.update(id, { loaded, total, percent: total ? Math.min(100, Math.round(loaded / total * 100)) : null });
          });
        if (this.generation !== generation || this.get(id)?.status !== "active") return;
        const disposition = xhr.getResponseHeader("Content-Disposition") || "";
        const encoded = disposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
        const plain = disposition.match(/filename="([^"]*)"|filename=([^;]*)/i);
        let fileName = paths.length === 1 ? name : "download.zip";
        try { if (encoded) fileName = decodeURIComponent(encoded); else if (plain) fileName = plain[1] || plain[2].trim(); } catch { /* Keep the supplied name. */ }
        const objectUrl = URL.createObjectURL(xhr.response as Blob);
        const anchor = document.createElement("a");
        anchor.href = objectUrl;
        anchor.download = fileName;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
        this.update(id, { status: "completed", percent: 100 });
        store.dispatch(clearFileCache());
        window.dispatchEvent(new Event("pocketspace:download-complete"));
      } catch (error) {
        if (this.generation === generation && this.get(id)?.status === "active")
          this.update(id, { status: controller.signal.aborted ? "cancelled" : "failed",
            error: controller.signal.aborted ? undefined : error instanceof Error ? error.message : "Download failed." });
      } finally {
        this.controllers.delete(id);
      }
    })();
  }

  cancel(id: string): void {
    const item = this.get(id);
    if (!item || terminal(item.status)) return;
    // Once the request body is sent, the server may already be publishing the file.
    if (item.kind === "upload" && item.status === "active" && item.percent === 100) return;
    if (item.status === "queued") this.queue = this.queue.filter(job => job.itemId !== id);
    this.update(id, { status: "cancelled" });
    this.controllers.get(id)?.abort();
  }

  clearFinished(): void {
    const activeBatches = new Set(this.items.filter(item => !terminal(item.status)).map(item => item.batchId));
    this.publish(this.items.filter(item => !terminal(item.status) || activeBatches.has(item.batchId)));
  }

  clearForAccountChange(): void {
    this.generation++;
    this.queue = [];
    for (const controller of this.controllers.values()) controller.abort();
    this.controllers.clear();
    this.publish([]);
  }
}

export const transferManager = new TransferManager();
window.addEventListener(AUTH_CHANGED_EVENT, () => transferManager.clearForAccountChange());
