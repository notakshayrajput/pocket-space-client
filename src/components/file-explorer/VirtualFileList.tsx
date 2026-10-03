import { useCallback, useLayoutEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { FileSystemEntry } from "../../types";
import { fileRowHeight, virtualFileRange, type FileViewMode } from "./virtual-files";

interface Viewport {
  width: number;
  top: number;
  bottom: number;
}

export default function VirtualFileList({ items, viewMode, renderItem }: {
  items: FileSystemEntry[];
  viewMode: FileViewMode;
  renderItem: (item: FileSystemEntry) => ReactNode;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState<Viewport>({ width: 0, top: 0, bottom: window.innerHeight });

  const measure = useCallback(() => {
    const host = hostRef.current;
    if (!host) return;
    const hostRect = host.getBoundingClientRect();
    const ancestors = [host.closest<HTMLElement>(".file-explorer"), host.closest<HTMLElement>(".panel")]
      .filter((element): element is HTMLElement => element !== null);
    const bounds = ancestors.map(element => element.getBoundingClientRect());
    const rowHeight = fileRowHeight(viewMode);
    // Row-sized steps avoid rerendering every visible card on each scroll pixel.
    const top = Math.floor((Math.max(0, ...bounds.map(rect => rect.top)) - hostRect.top) / rowHeight) * rowHeight;
    const bottom = Math.ceil((Math.min(window.innerHeight, ...bounds.map(rect => rect.bottom)) - hostRect.top) / rowHeight) * rowHeight;
    const next = { width: host.clientWidth, top, bottom };
    setViewport(previous => previous.width === next.width && previous.top === next.top && previous.bottom === next.bottom
      ? previous : next);
  }, [viewMode]);

  useLayoutEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const ancestors = new Set([host.closest<HTMLElement>(".file-explorer"), host.closest<HTMLElement>(".panel")]
      .filter((element): element is HTMLElement => element !== null));
    let frame = 0;
    const scheduleMeasure = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => { frame = 0; measure(); });
    };
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(scheduleMeasure);
    observer?.observe(host);
    for (const sibling of Array.from(host.parentElement?.children ?? [])) {
      if (sibling === host) break;
      observer?.observe(sibling);
    }
    ancestors.forEach(element => {
      observer?.observe(element);
      element.addEventListener("scroll", scheduleMeasure, { passive: true });
    });
    window.addEventListener("scroll", scheduleMeasure, { passive: true });
    window.addEventListener("resize", scheduleMeasure);
    measure();
    return () => {
      observer?.disconnect();
      ancestors.forEach(element => element.removeEventListener("scroll", scheduleMeasure));
      window.removeEventListener("scroll", scheduleMeasure);
      window.removeEventListener("resize", scheduleMeasure);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [measure, viewMode, items.length]);

  const range = virtualFileRange(items.length, viewport.width, viewMode, viewport.top, viewport.bottom);
  const rows = [];
  for (let row = range.startRow; row < range.endRow; row++) {
    const start = row * range.columns;
    rows.push(<div className={`virtual-file-row virtual-file-row-${viewMode}`} key={row}>
      {items.slice(start, start + range.columns).map(renderItem)}
    </div>);
  }

  return <div ref={hostRef} className="virtual-file-list" aria-label="Files">
    {range.paddingTop > 0 && <div style={{ height: range.paddingTop }} aria-hidden="true" />}
    {rows}
    {range.paddingBottom > 0 && <div style={{ height: range.paddingBottom }} aria-hidden="true" />}
  </div>;
}
