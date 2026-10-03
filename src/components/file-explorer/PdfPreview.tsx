import { useEffect, useRef, useState } from "react";
import { Alert, Button, Flex } from "antd";
import { PreviewSkeleton } from "../loading/LoadingSkeletons";
import * as pdfjs from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

export default function PdfPreview({ blob }: { blob: Blob }) {
  const container = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [document, setDocument] = useState<pdfjs.PDFDocumentProxy | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [width, setWidth] = useState(500);
  const [rendering, setRendering] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const target = container.current;
    if (!target) return;
    const observer = new ResizeObserver(() => setWidth(Math.max(200, target.clientWidth - 16)));
    observer.observe(target);
    setWidth(Math.max(200, target.clientWidth - 16));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let active = true;
    let task: pdfjs.PDFDocumentLoadingTask | undefined;
    setDocument(null);
    setPageNumber(1);
    setError(null);
    void blob.arrayBuffer().then(buffer => {
      if (!active) return;
      task = pdfjs.getDocument({ data: new Uint8Array(buffer) });
      return task.promise;
    }).then(result => {
      if (active && result) setDocument(result);
    }).catch(failure => {
      if (active) setError(failure instanceof Error ? failure.message : "PDF preview failed.");
    });
    return () => { active = false; void task?.destroy(); };
  }, [blob]);

  useEffect(() => {
    if (!document || !canvas.current) return;
    let active = true;
    let renderTask: pdfjs.RenderTask | undefined;
    setRendering(true);
    void (async () => {
      try {
        const page = await document.getPage(pageNumber);
        if (!active || !canvas.current) return;
        const original = page.getViewport({ scale: 1 });
        const displayScale = Math.min(width / original.width, 1.5, 1500 / original.height);
        const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
        const viewport = page.getViewport({ scale: displayScale * pixelRatio });
        const target = canvas.current;
        const context = target.getContext("2d");
        if (!context) throw new Error("Canvas is unavailable.");
        target.width = Math.ceil(viewport.width);
        target.height = Math.ceil(viewport.height);
        target.style.width = `${viewport.width / pixelRatio}px`;
        target.style.height = `${viewport.height / pixelRatio}px`;
        renderTask = page.render({ canvas: target, canvasContext: context, viewport });
        await renderTask.promise;
        if (active) setRendering(false);
      } catch (failure) {
        if (active && !(failure instanceof Error && failure.name === "RenderingCancelledException"))
          setError(failure instanceof Error ? failure.message : "PDF page could not be rendered.");
      }
    })();
    return () => { active = false; renderTask?.cancel(); };
  }, [document, pageNumber, width]);

  return <div ref={container} className="file-preview-pdf-viewer">
    {error && <Alert type="error" showIcon message={error} />}
    {document && <Flex justify="center" align="center" gap={10} className="file-preview-pdf-controls">
      <Button size="small" disabled={pageNumber === 1} onClick={() => setPageNumber(value => value - 1)}>Previous</Button>
      <span>Page {pageNumber} of {document.numPages}</span>
      <Button size="small" disabled={pageNumber === document.numPages} onClick={() => setPageNumber(value => value + 1)}>Next</Button>
    </Flex>}
    {(!document || rendering) && !error && <PreviewSkeleton kind="pdf" label="Rendering PDF" />}
    <canvas ref={canvas} className="file-preview-pdf-canvas" style={{ display: rendering ? "none" : "block" }} />
  </div>;
}
