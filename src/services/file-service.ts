import HttpService from "./http-service";
export default class FileService {
   public static async downloadFiles(paths: string[]): Promise<Response> {
        return await HttpService.getInstance().post<Response>("/download",{ paths },true);
    }
}
