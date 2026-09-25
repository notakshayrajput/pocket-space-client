import HttpService from "./http-service";
export default class UploadService {
  public static async uploadFiles(
    files: File[],
    destinationPath: string
  ): Promise<Response> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("Files", file); // Match the C# property name exactly
    });
    formData.append("DestinationPath", destinationPath || ".");

    return await HttpService.getInstance().post<Response>("/upload", formData, true);
  }
}
