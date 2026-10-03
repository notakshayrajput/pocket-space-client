import { CloudServerOutlined, DisconnectOutlined } from "@ant-design/icons";
import { useWebSocketStatus } from "../../hooks/web-socket/WebSocket";
import "./ServerStatusIndicator.css";

export const ServerStatusIndicator = () => {
  const { status } = useWebSocketStatus();
  const connected = status === "Connected";

  return (
    <div className="server-status" role="status" aria-label={`Server ${status.toLowerCase()}`}>
      <span className={`server-status-connection ${connected ? "is-connected" : "is-disconnected"}`}>
        {connected ? <CloudServerOutlined aria-hidden="true" /> : <DisconnectOutlined aria-hidden="true" />}
        <span>Server {status.toLowerCase()}</span>
      </span>
    </div>
  );
};
