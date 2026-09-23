import { useEffect, useState, useRef } from "react";
export type ServerState = "Idle" | "BackingUp" | "UserTraffic" | "Cleaning";

export function useWebSocketStatus() {
  const [status, setStatus] = useState<"Connected" | "Disconnected">("Disconnected");
   const [serverState, setServerState] = useState<ServerState | null>(null);
 
  const wsRef = useRef<WebSocket | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = () => {
    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const ws = new WebSocket(`${protocol}://${window.location.host}/ws`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("WebSocket connected");
      setStatus("Connected");
    };
      ws.onmessage = (event) => {
      const message = event.data as string;
      console.log("Received from server:", message);

      // Handle server state updates
      if (message.startsWith("server-state:")) {
        const state = message.split(":")[1];
        if (
          state === "Idle" ||
          state === "BackingUp" ||
          state === "UserTraffic" ||
          state === "Cleaning"
        ) {
          setServerState(state);
        }
      }
    };

    ws.onclose = () => {
      console.log("WebSocket disconnected");
      setStatus("Disconnected");
      setServerState(null);
      scheduleReconnect();
    };

    ws.onerror = (err) => {
      console.error("WebSocket error", err);
      ws.close(); // Triggers onclose -> reconnect
    };
  };

  const scheduleReconnect = () => {
    if (retryTimeoutRef.current) return; // Avoid multiple timers
    retryTimeoutRef.current = setTimeout(() => {
      console.log("Attempting to reconnect WebSocket...");
      connect();
      retryTimeoutRef.current = null;
    }, 5000); // 5 seconds retry
  };

  useEffect(() => {
    connect();

    const interval = setInterval(() => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        console.warn("WebSocket not open on interval check");
        setStatus("Disconnected");
      }
    }, 10000); // check every 10s

    return () => {
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
      clearInterval(interval);
      wsRef.current?.close();
    };
  }, []);

  return { status, serverState };
}
