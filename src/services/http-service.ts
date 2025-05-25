export default class HttpService {
  private baseUrl = import.meta.env.VITE_API_BASE_URL || "";
  private token: string | null = null;

  private constructor(token?: string) {
    if (token) {
      this.token = token;
    } else {
      this.token = localStorage.getItem("token");
    }
  }

  public static getInstance(token?: string): HttpService {
    return new HttpService(token);
  }

  private getHeaders(customHeaders: Record<string, string> = {}): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...customHeaders,
    };

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    return headers;
  }

  private async request<T>(
    method: string,
    url: string,
    data?: any,
    customHeaders: Record<string, string> = {}
  ): Promise<T> {
    const fullUrl = `${this.baseUrl}${url}`;
    const options: RequestInit = {
      method,
      headers: this.getHeaders(customHeaders),
    };

    if (data && method !== "GET") {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(fullUrl, options);
      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.message || `HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error: any) {
      console.error(`[HTTP ${method}] ${url}`, error);
      throw error;
    }
  }

  public get<T>(url: string): Promise<T> {
    return this.request<T>("GET", url);
  }

  public post<T>(url: string, data: any): Promise<T> {
    return this.request<T>("POST", url, data);
  }

  public put<T>(url: string, data: any): Promise<T> {
    return this.request<T>("PUT", url, data);
  }

  public delete<T>(url: string): Promise<T> {
    return this.request<T>("DELETE", url);
  }

  public patch<T>(url: string, data: any): Promise<T> {
    return this.request<T>("PATCH", url, data);
  }

  public upload<T>(url: string, formData: FormData): Promise<T> {
    const headers = {}; // Let browser set correct multipart boundary
    return this.request<T>("POST", url, formData, headers);
  }
}
