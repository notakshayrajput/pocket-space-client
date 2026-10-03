import { lazy, Suspense, useEffect, useState } from "react";
import { Alert, Spin } from "antd";
import type { PreviewFile } from "../../services/preview-service";
import { previewKind, previewText, visualBlob } from "../../services/preview-service";
import { rtfToText } from "../../services/rtf-to-text";

type PreviewState = { status: "loading" } | { status: "error"; message: string } |
  { status: "visual"; url: string } | { status: "pdf"; blob: Blob } |
  { status: "text"; value: string; truncated: boolean };

const PdfPreview = lazy(() => import("./PdfPreview"));

export default function FilePreview({ file }: { file: PreviewFile }) {
  const kind = previewKind(file.name);
  const [state, setState] = useState<PreviewState>({ status: "loading" });
  useEffect(() => {
    if (kind === "unsupported") {
      setState({ status: "error", message: "Preview is unavailable for this file type. Download it to open it in another app." });
      return;
    }
    if ((kind === "image" || kind === "pdf") && (file.size ?? 0) > 32 * 1024 * 1024) {
      setState({ status: "error", message: "This file is too large to preview. Download it to open it." });
      return;
    }
    let active = true;
    let objectUrl: string | undefined;
    const controller = new AbortController();
    setState({ status: "loading" });
    if (kind === "image" || kind === "pdf") {
      visualBlob(file).then(blob => {
        if (!active) return;
        if (kind === "pdf") setState({ status: "pdf", blob });
        else {
          objectUrl = URL.createObjectURL(blob);
          setState({ status: "visual", url: objectUrl });
        }
      }).catch(error => { if (active) setState({ status: "error", message: error instanceof Error ? error.message : "Preview failed." }); });
    } else {
      previewText(file, controller.signal).then(result => {
        if (active) setState({ status: "text", value: kind === "rtf" ? rtfToText(result.text) : result.text,
          truncated: result.truncated });
      }).catch(error => {
        if (active) setState({ status: "error", message: error instanceof Error ? error.message : "Preview failed." });
      });
    }
    return () => { active = false; controller.abort(); if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [file.name, file.relativePath, file.size, file.lastModified, kind]);

  if (state.status === "loading") return <div className="file-preview-loading"><Spin aria-label="Loading preview" /></div>;
  if (state.status === "error") return <Alert type="info" message={state.message} showIcon />;
  if (state.status === "text") return <div className="file-preview-text-wrap">
    <pre className="file-preview-text">{state.value || "This file is empty."}</pre>
    {state.truncated && <Alert type="info" message="Showing the first part of this file." />}
  </div>;
  if (state.status === "pdf") return <Suspense fallback={<div className="file-preview-loading"><Spin /></div>}>
    <PdfPreview blob={state.blob} />
  </Suspense>;
  return <img className="file-preview-image" src={state.url} alt={file.name} />;
}
