import { clearSession, readSession } from "../auth/auth-session";
import { notifyRequestError, notifyRequestSuccess } from "./request-notifications";

export default class HttpService {
  private baseUrl = import.meta.env.VITE_API_BASE_URL || "/api";

  private token?: string;

  private constructor(token?: string) { this.token = token; }

  public static getInstance(token?: string): HttpService {
    return new HttpService(token);
  }

  private async request<T>(method: string, url: string, data?: unknown, getRawResponse = false): Promise<T> {
    const token = this.token ?? readSession()?.accessToken;
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    try {
      let body: BodyInit | undefined;
      if (data instanceof FormData) {
        body = data;
      } else if (data !== undefined) {
        headers["Content-Type"] = "application/json";
        body = JSON.stringify(data);
      }
      const response = await fetch(`${this.baseUrl}${url}`, { method, headers, body });
      if (!response.ok) {
        // Do not let a failed request from an earlier login clear a newer token.
        if (response.status === 401 && url !== "/auth/login" && url !== "/auth/signup" && token === readSession()?.accessToken) clearSession();
        const responseText = await response.text();
        let detail = "";
        try {
          const errorBody = JSON.parse(responseText) as { message?: string; detail?: string; title?: string; errors?: Record<string, string[]> };
          detail = errorBody.message || errorBody.detail || Object.values(errorBody.errors ?? {}).flat().join(" ") || errorBody.title || "";
        } catch {
          detail = responseText.trim().startsWith("<") ? "" : responseText.trim();
        }
        throw new Error(detail || (response.status === 429
          ? "Too many requests. Please wait a minute and try again."
          : `Request failed (${response.status}). Please try again.`));
      }
      const result = getRawResponse ? response as T : response.status === 204 ? undefined as T : await response.json() as T;
      notifyRequestSuccess(method, url, data);
      return result;
    } catch (error) {
      notifyRequestError(method, url, data, error);
      throw error;
    }
  }

  public get<T>(url: string): Promise<T> { return this.request<T>("GET", url); }
  public post<T>(url: string, data: unknown, getRawResponse = false): Promise<T> { return this.request<T>("POST", url, data, getRawResponse); }
  public put<T>(url: string, data: unknown): Promise<T> { return this.request<T>("PUT", url, data); }
  public delete<T>(url: string): Promise<T> { return this.request<T>("DELETE", url); }
  public patch<T>(url: string, data: unknown): Promise<T> { return this.request<T>("PATCH", url, data); }
  public upload<T>(url: string, data: FormData): Promise<T> { return this.request<T>("POST", url, data); }
}
