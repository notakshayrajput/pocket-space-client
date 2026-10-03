import { useEffect, useRef, useState } from "react";
import { FileOutlined, FilePdfOutlined, FileTextOutlined, FolderOutlined, PictureOutlined } from "@ant-design/icons";
import { AUTH_CHANGED_EVENT } from "../../auth/auth-session";
import type { FileSystemEntry } from "../../types";
import { previewKind, thumbnailAllowed } from "../../services/preview-service";
import { cachedThumbnail, loadThumbnail, thumbnailKey } from "../../services/thumbnail-service";

export default function FileThumbnail({ item }: { item: FileSystemEntry }) {
  const container = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [thumbnail, setThumbnail] = useState<{ key: string; url: string } | null>(null);
  const [revision, setRevision] = useState(0);
  const kind = item.isFolder ? "folder" : previewKind(item.name);
  const key = thumbnailKey(item);
  const image = thumbnail?.key === key ? thumbnail.url : cachedThumbnail(item);

  useEffect(() => {
    const reset = () => { setThumbnail(null); setRevision(value => value + 1); };
    window.addEventListener(AUTH_CHANGED_EVENT, reset);
    window.addEventListener("pocketspace:upload-complete", reset);
    return () => {
      window.removeEventListener(AUTH_CHANGED_EVENT, reset);
      window.removeEventListener("pocketspace:upload-complete", reset);
    };
  }, []);

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
    loadThumbnail(item).then(url => {
      if (active) setThumbnail({ key, url });
    }).catch(() => { /* Keep the file-type icon when a thumbnail cannot be rendered. */ });
    return () => { active = false; };
  }, [visible, item.name, item.relativePath, item.size, item.lastModified, key, revision]);

  const icon = kind === "folder" ? <FolderOutlined /> : kind === "pdf" ? <FilePdfOutlined />
    : kind === "image" ? <PictureOutlined />
      : kind === "text" || kind === "rtf" || kind === "docx" ? <FileTextOutlined /> : <FileOutlined />;
  const label = kind === "folder" ? "Folder" : item.name.includes(".") ? item.name.split(".").pop()?.toUpperCase() : "FILE";
  return <div ref={container} data-kind={kind} className={`file-thumbnail ${image ? "has-image" : ""}`} aria-hidden="true">
    {image ? <img src={image} alt="" loading="lazy" /> : <>{icon}<span>{label}</span></>}
  </div>;
}
