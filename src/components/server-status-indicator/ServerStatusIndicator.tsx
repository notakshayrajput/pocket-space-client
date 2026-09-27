import { CheckCircleOutlined, CloudServerOutlined, DisconnectOutlined, LoadingOutlined, SyncOutlined } from "@ant-design/icons";
import { useWebSocketStatus, type ServerState } from "../../hooks/web-socket/WebSocket";
import "./ServerStatusIndicator.css";

const stateLabels: Record<ServerState, string> = {
  Idle: "Idle",
  BackingUp: "Backing up",
  UserTraffic: "Serving requests",
  Cleaning: "Cleaning up",
};

export const ServerStatusIndicator = () => {
  const { status, serverState } = useWebSocketStatus();
  const connected = status === "Connected";
  const activity = connected && serverState ? stateLabels[serverState] : null;

  return (
    <div className="server-status" role="status" aria-label={`Server ${status.toLowerCase()}${activity ? `, ${activity.toLowerCase()}` : ""}`}>
      <span className={`server-status-connection ${connected ? "is-connected" : "is-disconnected"}`}>
        {connected ? <CloudServerOutlined aria-hidden="true" /> : <DisconnectOutlined aria-hidden="true" />}
        <span>Server {status.toLowerCase()}</span>
      </span>
      {connected && (
        <span className="server-status-activity">
          {serverState === "Idle" ? <CheckCircleOutlined aria-hidden="true" /> : serverState ? <SyncOutlined spin aria-hidden="true" /> : <LoadingOutlined aria-hidden="true" />}
          <span>{activity ?? "Checking activity"}</span>
        </span>
      )}
    </div>
  );
};
