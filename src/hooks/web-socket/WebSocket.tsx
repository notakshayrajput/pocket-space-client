import { useSyncExternalStore } from "react";
import { createWebSocketStatusStore } from "./web-socket-status-store";

export type { ServerState } from "./web-socket-status-store";

const store = createWebSocketStatusStore(() => {
  const url = new URL(import.meta.env.VITE_API_BASE_URL || "/api", window.location.origin);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  url.pathname = "/ws";
  url.search = "";
  url.hash = "";
  return url;
});

// Fast Refresh must release the old module's connection and retry timers.
if (import.meta.hot) import.meta.hot.dispose(store.dispose);

export function useWebSocketStatus() {
  return useSyncExternalStore(store.subscribe, store.getSnapshot);
}
