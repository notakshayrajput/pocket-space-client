export type FileViewMode = "grid" | "list";

// Keep these dimensions aligned with the virtual row and card rules in FileExplorer.css.
const GRID_CELL_WIDTH = 216;
const GRID_ROW_HEIGHT = 216;
const LIST_ROW_HEIGHT = 96;
const OVERSCAN_ROWS = 3;

export function fileRowHeight(viewMode: FileViewMode): number {
  return viewMode === "grid" ? GRID_ROW_HEIGHT : LIST_ROW_HEIGHT;
}

export interface VirtualFileRange {
  columns: number;
  rowHeight: number;
  startRow: number;
  endRow: number;
  paddingTop: number;
  paddingBottom: number;
}

export function virtualFileRange(
  itemCount: number,
  width: number,
  viewMode: FileViewMode,
  visibleTop: number,
  visibleBottom: number,
): VirtualFileRange {
  const columns = viewMode === "grid" ? Math.max(1, Math.floor(width / GRID_CELL_WIDTH)) : 1;
  const rowHeight = fileRowHeight(viewMode);
  const rowCount = Math.ceil(itemCount / columns);
  const startRow = Math.min(rowCount, Math.max(0, Math.floor(visibleTop / rowHeight) - OVERSCAN_ROWS));
  const endRow = Math.min(rowCount, Math.max(startRow, Math.ceil(visibleBottom / rowHeight) + OVERSCAN_ROWS));
  return {
    columns,
    rowHeight,
    startRow,
    endRow,
    paddingTop: startRow * rowHeight,
    paddingBottom: (rowCount - endRow) * rowHeight,
  };
}
