import type { NotificationInstance } from "antd/es/notification/interface";

let notifications: NotificationInstance | null = null;
const reportedErrors = new WeakSet<object>();

export function registerRequestNotifications(instance: NotificationInstance): () => void {
  notifications = instance;
  return () => { if (notifications === instance) notifications = null; };
}

function actionName(method: string, url: string, data?: unknown): [string, string] {
  const path = url.split("?")[0];
  if (path === "/upload") return ["Upload failed", "Files uploaded"];
  if (path === "/download") return ["Download failed", "Download started"];
  if (path === "/space/folders" && method === "POST") return ["Could not create folder", "Folder created"];
  if (path === "/space/rename") return ["Could not rename item", "Item renamed"];
  if (path === "/space/entry") return ["Could not move item to Trash", "Item moved to Trash"];
  if (/^\/space\/files\/[^/]+\/favorite$/.test(path)) {
    const favorite = (data as { isFavorite?: boolean } | undefined)?.isFavorite;
    return favorite ? ["Could not add to favorites", "Added to favorites"]
      : ["Could not remove from favorites", "Removed from favorites"];
  }
  if (/^\/space\/trash\/[^/]+\/restore$/.test(path)) return ["Could not restore item", "Item restored"];
  if (/^\/space\/trash\/[^/]+$/.test(path)) return ["Could not permanently delete item", "Item permanently deleted"];
  if (path === "/space/home") return ["Could not load your files", ""];
  if (path === "/space/folder-info") return ["Could not load folder", ""];
  if (path === "/space/trash") return ["Could not load Trash", ""];
  if (path === "/space/drive-stats") return ["Could not load storage usage", ""];
  if (path === "/auth/login") return ["Sign in failed", "Signed in"];
  if (path === "/auth/signup") return ["Could not create account", "Account created"];
  if (path === "/auth/me") return ["Could not load your account", ""];
  if (path === "/auth/change-password") return ["Could not change password", "Password changed"];
  if (path === "/auth/password-reset-request") return ["Could not request password reset", "Password reset requested"];
  if (path === "/admin/users/pending") return ["Could not load pending accounts", ""];
  if (path === "/admin/users/password-reset-requests") return ["Could not load password reset requests", ""];
  if (path === "/admin/users" && method === "GET") return ["Could not load accounts", ""];
  if (/^\/admin\/users\/[^/]+\/approve$/.test(path)) return ["Could not approve account", "Account approved"];
  if (/^\/admin\/users\/[^/]+\/quota$/.test(path)) return ["Could not update quota", "Quota updated"];
  if (/^\/admin\/users\/[^/]+\/reset-password$/.test(path)) return ["Could not reset password", "Password reset. Share the new password directly."];
  return ["Request failed", method === "GET" ? "" : "Request completed"];
}

export function notifyRequestError(method: string, url: string, data: unknown, error: unknown): void {
  if (typeof error === "object" && error !== null) reportedErrors.add(error);
  notifications?.error({
    key: method === "GET" ? `${method}:${url}` : undefined,
    message: actionName(method, url, data)[0],
    description: error instanceof Error ? error.message : "Please try again.",
    duration: 0,
  });
}

export function notifyUnreportedRequestError(method: string, url: string, data: unknown, error: unknown): void {
  if (typeof error !== "object" || error === null || !reportedErrors.has(error))
    notifyRequestError(method, url, data, error);
}

export function notifyRequestSuccess(method: string, url: string, data: unknown): void {
  if (method === "GET" || url.split("?")[0] === "/download") return;
  const title = actionName(method, url, data)[1];
  if (title) notifications?.success({
    message: title,
    duration: /\/reset-password$/.test(url) ? 8 : 3,
  });
}
