import type { DriveStats, FolderInfo } from "../types";
import HttpService from "./http-service";
export default class SpaceService {
  public static async getDriveStats(): Promise<DriveStats> {
    return await HttpService.getInstance().get<DriveStats>("/space/drive-stats");
  }
  public static async getFolderInfo(relativePath?: string|null): Promise<FolderInfo> {
    return await HttpService.getInstance().get<FolderInfo>(`/space/folder-info?relativePath=${encodeURIComponent(relativePath || "")}`);
  }
}
