/* eslint react/react-in-jsx-scope: off */
import type { CSSProperties } from "react";
import "./LoadingSkeletons.css";

type FileView = "grid" | "list";

export function FileExplorerSkeleton({ viewMode, count, label = "Loading files" }: {
  viewMode: FileView;
  count?: number;
  label?: string;
}) {
  const items = count ?? (viewMode === "grid" ? 8 : 5);
  return <div className={`file-skeleton-collection ${viewMode}`} role="status" aria-label={label}>
    <span className="loading-skeleton-sr">{label}</span>
    {Array.from({ length: items }, (_, index) => <div key={index} className={`file-item ${viewMode}-item file-skeleton-item`} aria-hidden="true">
      <div className="file-skeleton-thumbnail loading-skeleton-shimmer" />
      <div className="file-skeleton-details">
        <div className="file-skeleton-name loading-skeleton-shimmer" />
        {viewMode === "list" && <div className="file-skeleton-subtitle loading-skeleton-shimmer" />}
      </div>
    </div>)}
  </div>;
}

export function TableSkeleton({ columns, rows = 5, label = "Loading table" }: {
  columns: number;
  rows?: number;
  label?: string;
}) {
  const style = { gridTemplateColumns: `repeat(${columns}, minmax(120px, 1fr))` } satisfies CSSProperties;
  return <div className="table-skeleton" role="status" aria-label={label}>
    <span className="loading-skeleton-sr">{label}</span>
    <div className="table-skeleton-scroll">
      <div className="table-skeleton-row table-skeleton-heading" style={style} aria-hidden="true">
        {Array.from({ length: columns }, (_, index) => <div key={index} className="loading-skeleton-shimmer" />)}
      </div>
      {Array.from({ length: rows }, (_, row) => <div key={row} className="table-skeleton-row" style={style} aria-hidden="true">
        {Array.from({ length: columns }, (_, column) => <div key={column} className="loading-skeleton-shimmer" />)}
      </div>)}
    </div>
  </div>;
}

export function ListSkeleton({ rows = 4, label = "Loading items" }: { rows?: number; label?: string }) {
  return <div className="list-skeleton" role="status" aria-label={label}>
    <span className="loading-skeleton-sr">{label}</span>
    {Array.from({ length: rows }, (_, index) => <div className="list-skeleton-row" key={index} aria-hidden="true">
      <div className="list-skeleton-icon loading-skeleton-shimmer" />
      <div className="list-skeleton-copy">
        <div className="loading-skeleton-shimmer" />
        <div className="loading-skeleton-shimmer" />
      </div>
      <div className="list-skeleton-action loading-skeleton-shimmer" />
    </div>)}
  </div>;
}

export function PreviewSkeleton({ kind = "text", label = "Loading preview" }: {
  kind?: "text" | "image" | "pdf";
  label?: string;
}) {
  return <div className={`preview-skeleton preview-skeleton-${kind}`} role="status" aria-label={label}>
    <span className="loading-skeleton-sr">{label}</span>
    {kind === "text" ? Array.from({ length: 8 }, (_, index) =>
      <div key={index} className="preview-skeleton-line loading-skeleton-shimmer" aria-hidden="true" />)
      : <div className="preview-skeleton-surface loading-skeleton-shimmer" aria-hidden="true" />}
  </div>;
}

export function AppShellSkeleton() {
  return <div className="app-shell-skeleton" role="status" aria-label="Checking login">
    <span className="loading-skeleton-sr">Checking login</span>
    <aside aria-hidden="true">
      <div className="loading-skeleton-shimmer" />
      {Array.from({ length: 6 }, (_, index) => <div key={index} className="loading-skeleton-shimmer" />)}
    </aside>
    <main aria-hidden="true">
      <div className="app-shell-skeleton-title loading-skeleton-shimmer" />
      <div className="app-shell-skeleton-subtitle loading-skeleton-shimmer" />
      <div className="app-shell-skeleton-card loading-skeleton-shimmer" />
      <div className="app-shell-skeleton-card loading-skeleton-shimmer" />
    </main>
  </div>;
}
