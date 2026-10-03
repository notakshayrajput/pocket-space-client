import { AUTH_CHANGED_EVENT, readSession } from "../../auth/auth-session.ts";

interface StatusSnapshot {
  status: "Connected" | "Disconnected";
}

const disconnected: StatusSnapshot = { status: "Disconnected" };
const optimistic: StatusSnapshot = { status: "Connected" };
const INITIAL_CONNECTION_GRACE_MS = 5000;

export function createWebSocketStatusStore(getUrl: () => URL) {
  const listeners = new Set<() => void>();
  let snapshot = optimistic;
  let socket: WebSocket | null = null;
  let accessToken: string | undefined;
  let connectTimer: ReturnType<typeof setTimeout> | undefined;
  let graceTimer: ReturnType<typeof setTimeout> | undefined;
  let disposeTimer: ReturnType<typeof setTimeout> | undefined;
  let retryDelay = 1000;
  let hasConnected = false;

  function publish(next: StatusSnapshot) {
    if (snapshot.status === next.status) return;
    snapshot = next;
    listeners.forEach(listener => listener());
  }

  function stopSocket() {
    clearTimeout(connectTimer);
    connectTimer = undefined;
    clearTimeout(graceTimer);
    graceTimer = undefined;
    const previous = socket;
    socket = null;
    accessToken = undefined;
    hasConnected = false;
    if (previous) {
      previous.onopen = previous.onerror = previous.onclose = null;
      previous.close();
    }
  }

  function disconnect() {
    stopSocket();
    publish(disconnected);
  }

  function beginInitialConnection() {
    publish(optimistic);
    clearTimeout(graceTimer);
    graceTimer = setTimeout(() => {
      graceTimer = undefined;
      if (!hasConnected && listeners.size > 0 && readSession()) publish(disconnected);
    }, INITIAL_CONNECTION_GRACE_MS);
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
      if (hasConnected) publish(disconnected);
      retry();
      return;
    }
    socket = current;
    accessToken = token;
    current.onopen = () => {
      if (socket !== current) return;
      retryDelay = 1000;
      hasConnected = true;
      clearTimeout(graceTimer);
      graceTimer = undefined;
      publish(optimistic);
    };
    // A WebSocket error is followed by close. Let close own reconnection;
    // explicitly closing here can interrupt an in-progress handshake.
    current.onerror = () => {
      if (socket === current && hasConnected) publish(disconnected);
    };
    current.onclose = () => {
      if (socket !== current) return;
      socket = null;
      accessToken = undefined;
      if (hasConnected) publish(disconnected);
      retry();
    };
  }

  function syncSession() {
    const token = readSession()?.accessToken;
    if (token && token === accessToken) return;
    stopSocket();
    retryDelay = 1000;
    if (token) {
      beginInitialConnection();
      scheduleConnect(0);
    } else publish(disconnected);
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
      if (listeners.size === 1) {
        if (readSession()) beginInitialConnection();
        else publish(disconnected);
      }
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
