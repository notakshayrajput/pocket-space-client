import type { DriveStats, FolderInfo, FolderPageRequest } from "../types";
import HttpService from "./http-service";
export default class SpaceService {
  public static async getDriveStats(): Promise<DriveStats> {
    return await HttpService.getInstance().get<DriveStats>("/space/drive-stats");
  }
  public static async getFolderInfo(request: FolderPageRequest): Promise<FolderInfo> {
    const params = new URLSearchParams({
      relativePath: request.relativePath,
      search: request.search,
      sortBy: request.sortBy,
      direction: request.direction,
      offset: String(request.offset),
      limit: "50",
    });
    return await HttpService.getInstance().get<FolderInfo>(`/space/folder-info?${params}`);
  }
}
