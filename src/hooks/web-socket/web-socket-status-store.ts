import { AUTH_CHANGED_EVENT, readSession } from "../../auth/auth-session.ts";

export type ServerState = "Idle" | "BackingUp" | "UserTraffic" | "Cleaning";
interface StatusSnapshot {
  status: "Connected" | "Disconnected";
  serverState: ServerState | null;
}

const disconnected: StatusSnapshot = { status: "Disconnected", serverState: null };

export function createWebSocketStatusStore(getUrl: () => URL) {
  const listeners = new Set<() => void>();
  let snapshot = disconnected;
  let socket: WebSocket | null = null;
  let accessToken: string | undefined;
  let connectTimer: ReturnType<typeof setTimeout> | undefined;
  let disposeTimer: ReturnType<typeof setTimeout> | undefined;
  let retryDelay = 1000;

  function publish(next: StatusSnapshot) {
    if (snapshot.status === next.status && snapshot.serverState === next.serverState) return;
    snapshot = next;
    listeners.forEach(listener => listener());
  }

  function disconnect() {
    clearTimeout(connectTimer);
    connectTimer = undefined;
    const previous = socket;
    socket = null;
    accessToken = undefined;
    if (previous) {
      previous.onopen = previous.onmessage = previous.onerror = previous.onclose = null;
      previous.close();
    }
    publish(disconnected);
  }

  function scheduleConnect(delay: number) {
    if (listeners.size === 0 || socket || connectTimer !== undefined) return;
    connectTimer = setTimeout(() => {
      connectTimer = undefined;
      connect();
    }, delay);
  }

  function retry() {
    if (!readSession()) return;
    scheduleConnect(retryDelay);
    retryDelay = Math.min(retryDelay * 2, 30000);
  }

  function connect() {
    const token = readSession()?.accessToken;
    if (listeners.size === 0 || socket || !token) return;
    let current: WebSocket;
    try {
      current = new WebSocket(getUrl(), ["pocketspace", `bearer.${token}`]);
    } catch {
      publish(disconnected);
      retry();
      return;
    }
    socket = current;
    accessToken = token;
    current.onopen = () => {
      if (socket !== current) return;
      retryDelay = 1000;
      publish({ status: "Connected", serverState: null });
    };
    current.onmessage = event => {
      if (socket !== current || typeof event.data !== "string") return;
      const state = event.data.replace(/^server-state:/, "");
      if (state === "Idle" || state === "BackingUp" || state === "UserTraffic" || state === "Cleaning") {
        publish({ ...snapshot, serverState: state });
      }
    };
    // A WebSocket error is followed by close. Let close own reconnection;
    // explicitly closing here can interrupt an in-progress handshake.
    current.onerror = () => {
      if (socket === current) publish(disconnected);
    };
    current.onclose = () => {
      if (socket !== current) return;
      socket = null;
      accessToken = undefined;
      publish(disconnected);
      retry();
    };
  }

  function syncSession() {
    const token = readSession()?.accessToken;
    if (token && token === accessToken) return;
    disconnect();
    retryDelay = 1000;
    if (token) scheduleConnect(0);
  }

  function dispose() {
    clearTimeout(disposeTimer);
    disposeTimer = undefined;
    window.removeEventListener(AUTH_CHANGED_EVENT, syncSession);
    disconnect();
    retryDelay = 1000;
  }

  return {
    getSnapshot: () => snapshot,
    subscribe(listener: () => void) {
      clearTimeout(disposeTimer);
      disposeTimer = undefined;
      listeners.add(listener);
      window.addEventListener(AUTH_CHANGED_EVENT, syncSession);
      // Wait until React finishes its setup/cleanup cycle before opening a
      // socket. All consumers share this one connection and one retry timer.
      scheduleConnect(0);
      return () => {
        listeners.delete(listener);
        if (listeners.size === 0) {
          clearTimeout(connectTimer);
          connectTimer = undefined;
          // A route change or Strict Mode resubscription can reuse the socket.
          disposeTimer = setTimeout(dispose, 0);
        }
      };
    },
    dispose,
  };
}
