import HttpService from "./http-service";
import type { HomeFiles, TrashEntry } from "../types";
export default class FileService {
   public static getHome(): Promise<HomeFiles> {
        return HttpService.getInstance().get<HomeFiles>("/space/home");
   }
   public static setFavorite(id: string, isFavorite: boolean): Promise<void> {
        return HttpService.getInstance().put<void>(`/space/files/${encodeURIComponent(id)}/favorite`, { isFavorite });
   }
   public static getTrash(): Promise<TrashEntry[]> {
        return HttpService.getInstance().get<TrashEntry[]>("/space/trash");
   }
   public static restore(id: string): Promise<void> {
        return HttpService.getInstance().post<void>(`/space/trash/${encodeURIComponent(id)}/restore`, {});
   }
   public static deleteTrashItem(id: string): Promise<void> {
        return HttpService.getInstance().delete<void>(`/space/trash/${encodeURIComponent(id)}`);
   }
}
