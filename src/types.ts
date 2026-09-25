export interface DriveStats {
  directory: string;
  availableSpace: number;
  totalSpace: number;
  occupiedSpace: number;
}
export interface FolderInfo {
  name: string;
  lastModified: string;
  relativePath: string;
  files: FileSystemEntry[];
}
export interface FileSystemEntry{
  id: string;
  isFavorite: boolean;
  recentAt: string;
  name: string;
  isFolder: boolean;
  lastModified?: string; // Optional for directories
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
