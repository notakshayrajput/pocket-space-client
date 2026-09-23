import React from "react";
import { Tooltip } from "antd";
import type { DriveStats } from "../../types";
import { formatBytes } from "../../services/util";
import "./StorageProgress.css"; 

interface Props {
  stats: DriveStats;
}

const StorageProgress: React.FC<Props> = ({ stats }) => {
  const total = stats.totalSpace;
  const available = stats.availableSpace;
  const backupSize = stats.occupiedSpace;
  const unavailable = total - available - backupSize;

  const percentBackup = (backupSize / total) * 100;
  const percentUnavailable = (unavailable / total) * 100;
  const percentAvailable = (available / total) * 100;

  return (
    
      <div style={{
        display: "flex",
        height: "8px",
        marginTop: "16px",
        borderRadius: "6px",
        overflow: "hidden",
        boxShadow: "inset 0 1px 2px rgba(0,0,0,0.1)",
        backgroundColor: "#e6f4ff"
      }}>
        <Tooltip title={`Unavailable: ${formatBytes(unavailable)}`}>
          <div className="unavailable" style={{ width: `${percentUnavailable}%` }} />
        </Tooltip>
        <Tooltip title={`Backup: ${formatBytes(backupSize)}`}>
          <div className="backup" style={{ width: `${percentBackup}%` }} />
        </Tooltip>
        <Tooltip title={`Available: ${formatBytes(available)}`}>
          <div className="available" style={{ width: `${percentAvailable}%` }} />
        </Tooltip>
      </div>
  );
};

export default StorageProgress;
