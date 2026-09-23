import HttpService from "./http-service";
export default class FileService {
   public static async downloadFiles(paths: string[]): Promise<Response> {
        return await HttpService.getInstance().post<any>("/download",{ paths },true);
    }
}
