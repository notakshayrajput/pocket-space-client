import type { DriveStats, FolderInfo } from "../types";
import HttpService from "./http-service";
export default class DownloadService {
   public static async downloadFiles(paths: string[]): Promise<Response> {
        return await HttpService.getInstance().post<any>("/download",{ paths },true);
    }
}
