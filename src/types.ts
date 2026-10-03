export interface DriveStats {
  directory: string;
  backend: "FileSystem" | "S3";
  globalUsedBytes: number;
  globalLimitBytes: number | null;
  availableSpace: number;
  totalSpace: number;
  occupiedSpace: number;
  quotaBytes: number;
}
export interface FolderInfo {
  name: string;
  lastModified: string;
  relativePath: string;
  files: FileSystemEntry[];
  totalCount: number;
  nextOffset: number;
  hasMore: boolean;
}
export type FileSortField = "name" | "size" | "lastModified" | "createdAt";
export type FileSortDirection = "asc" | "desc";
export interface FolderPageRequest {
  relativePath: string;
  search: string;
  sortBy: FileSortField;
  direction: FileSortDirection;
  offset: number;
}
export interface FileSystemEntry{
  id: string;
  isFavorite: boolean;
  recentAt: string;
  name: string;
  isFolder: boolean;
  lastModified?: string; // Optional for directories
  createdAt?: string;
  size?: number; // Optional for files
  relativePath: string; // Relative path from the root of the file system
  }

export interface HomeFiles {
  favorites: FileSystemEntry[];
  recent: FileSystemEntry[];
}

export interface TrashEntry {
  id: string;
  name: string;
  originalPath: string;
  isFolder: boolean;
  size: number;
  trashedAt: string;
  expiresAt: string;
}
