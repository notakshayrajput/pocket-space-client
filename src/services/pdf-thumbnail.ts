import * as pdfjs from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

const rendered = new WeakMap<Blob, Promise<string>>();

export function pdfThumbnail(blob: Blob): Promise<string> {
  const existing = rendered.get(blob);
  if (existing) return existing;
  const work = renderFirstPage(blob).catch(error => { rendered.delete(blob); throw error; });
  rendered.set(blob, work);
  return work;
}

async function renderFirstPage(blob: Blob): Promise<string> {
  const loading = pdfjs.getDocument({ data: new Uint8Array(await blob.arrayBuffer()) });
  try {
    const document = await loading.promise;
    const page = await document.getPage(1);
    const original = page.getViewport({ scale: 1 });
    const viewport = page.getViewport({ scale: Math.min(180 / original.width, 220 / original.height) });
    const canvas = window.document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas is unavailable.");
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    await page.render({ canvas, canvasContext: context, viewport }).promise;
    return canvas.toDataURL("image/png");
  } finally {
    await loading.destroy();
  }
}
