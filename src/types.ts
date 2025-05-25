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
  name: string;
  isFolder: boolean;
  lastModified?: string; // Optional for directories
  size?: number; // Optional for files
  relativePath: string; // Relative path from the root of the file system
  }
