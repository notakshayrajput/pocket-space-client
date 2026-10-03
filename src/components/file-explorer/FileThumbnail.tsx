import { useEffect, useRef, useState } from "react";
import { FileOutlined, FilePdfOutlined, FileTextOutlined, FolderOutlined, PictureOutlined } from "@ant-design/icons";
import type { FileSystemEntry } from "../../types";
import { previewKind, thumbnailAllowed, visualBlob } from "../../services/preview-service";

export default function FileThumbnail({ item }: { item: FileSystemEntry }) {
  const container = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const kind = item.isFolder ? "folder" : previewKind(item.name);

  useEffect(() => {
    if (!thumbnailAllowed(item)) return;
    const target = container.current;
    if (!target || !('IntersectionObserver' in window)) { setVisible(true); return; }
    const observer = new IntersectionObserver(entries => {
      if (entries[0]?.isIntersecting) { setVisible(true); observer.disconnect(); }
    }, { rootMargin: "120px" });
    observer.observe(target);
    return () => observer.disconnect();
  }, [item.name, item.relativePath, item.size]);

  useEffect(() => {
    if (!visible || !thumbnailAllowed(item)) return;
    let active = true;
    let objectUrl: string | undefined;
    visualBlob(item).then(async blob => {
      if (!active) return;
      if (kind === "image") {
        objectUrl = URL.createObjectURL(blob);
        setThumbnail(objectUrl);
      } else if (kind === "pdf") {
        const { pdfThumbnail } = await import("../../services/pdf-thumbnail");
        const image = await pdfThumbnail(blob);
        if (active) setThumbnail(image);
      }
    }).catch(() => { /* Keep the file-type icon when a thumbnail cannot be rendered. */ });
    return () => { active = false; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [visible, item.name, item.relativePath, item.size, item.lastModified, kind]);

  const icon = kind === "folder" ? <FolderOutlined /> : kind === "pdf" ? <FilePdfOutlined />
    : kind === "image" ? <PictureOutlined />
      : kind === "text" || kind === "rtf" || kind === "docx" ? <FileTextOutlined /> : <FileOutlined />;
  const label = kind === "folder" ? "Folder" : item.name.includes(".") ? item.name.split(".").pop()?.toUpperCase() : "FILE";
  return <div ref={container} data-kind={kind} className={`file-thumbnail ${thumbnail ? "has-image" : ""}`} aria-hidden="true">
    {thumbnail ? <img src={thumbnail} alt="" loading="lazy" /> : <>{icon}<span>{label}</span></>}
  </div>;
}
