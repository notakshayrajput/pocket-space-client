import { useWebSocketStatus } from "../../hooks/web-socket/WebSocket";

export const ServerStatusIndicator = () => {
  const {status, serverState} = useWebSocketStatus(); // adjust port if needed

  return (
    <div>
      Server Status:{" "}
      <span style={{ color: status === "Connected" ? "green" : "red" }}>
        {status}
      </span>
      <div>
        Server State:{" "}
        <span style={{ color: serverState === "Idle" ? "blue" : "orange" }}>
          {serverState || "Unknown"}
        </span>
      </div>
    </div>    
  );
};
