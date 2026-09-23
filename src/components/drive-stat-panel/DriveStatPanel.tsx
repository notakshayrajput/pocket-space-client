import React, { useEffect, useState } from "react";
import SpaceService from "../../services/space-service";
import { Card, Alert, Descriptions, Tooltip, Skeleton } from "antd";
import type { DriveStats } from "../../types";
import { formatBytes } from "../../services/util";
import StorageProgress from "../storage-progress/StorageProgress";
import { InfoCircleOutlined } from "@ant-design/icons";
import { useWebSocketStatus } from "../../hooks/web-socket/WebSocket";

const DriveStatsPanel: React.FC = () => {
  const [stats, setStats] = useState<DriveStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const { status } = useWebSocketStatus();
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await SpaceService.getDriveStats();
        setStats(data);
      } catch (err: any) {
        setError(err.message || "Failed to fetch drive stats.");
      } finally {
        setLoading(false);
      }
    };
    console.log("Fetching drive stats...", status);
    if (!stats || status === "Connected") {
      setError(null);
      fetchStats();
    }
  }, [status]);

  if (error) return <Alert type="error" message={error} />;

  const skeletonContent = (
    <Descriptions title="Drive Info" bordered column={1} size="small">
      {[
        "Directory",
        "Total Space",
        "Available",
        "Backup Size",
        "Unavailable",
      ].map((label) => (
        <Descriptions.Item label={label} key={label}>
          <Skeleton.Input style={{ width: 200 }} active size="small" />
        </Descriptions.Item>
      ))}
    </Descriptions>
  );

  const loadedContent = stats && (
    <>
      <Descriptions
        title="Drive Info"
        bordered
        column={1}
        size="small"
        style={{ marginBottom: 16 }}
      >
        <Descriptions.Item label="Directory">
          {stats.directory}
        </Descriptions.Item>
        <Descriptions.Item
          label={
            <>
              Total Space{" "}
              <Tooltip title="Total drive size">
                <InfoCircleOutlined />
              </Tooltip>
            </>
          }
        >
          {formatBytes(stats.totalSpace)}
        </Descriptions.Item>
        <Descriptions.Item
          label={
            <>
              Available{" "}
              <Tooltip title="Space available for new data">
                <InfoCircleOutlined />
              </Tooltip>
            </>
          }
        >
          {formatBytes(stats.availableSpace)} (
          {((stats.availableSpace / stats.totalSpace) * 100).toFixed(2)}%)
        </Descriptions.Item>
        <Descriptions.Item
          label={
            <>
              Backup Size{" "}
              <Tooltip title="Space occupied by the backup directory">
                <InfoCircleOutlined />
              </Tooltip>
            </>
          }
        >
          {formatBytes(stats.occupiedSpace)} (
          {((stats.occupiedSpace / stats.totalSpace) * 100).toFixed(2)}%)
        </Descriptions.Item>
        <Descriptions.Item
          label={
            <>
              Unavailable{" "}
              <Tooltip title="Space occupied by stuff outside the backup directory">
                <InfoCircleOutlined />
              </Tooltip>
            </>
          }
        >
          {formatBytes(
            stats.totalSpace - stats.availableSpace - stats.occupiedSpace
          )}{" "}
          (
          {(
            ((stats.totalSpace - stats.availableSpace - stats.occupiedSpace) /
              stats.totalSpace) *
            100
          ).toFixed(2)}
          %)
        </Descriptions.Item>
      </Descriptions>

      <div style={{ marginTop: 16 }}>
        <StorageProgress stats={stats} />
      </div>
    </>
  );

  return (
    <Card title="Home" style={{ width: 400 }}>
      {loading ? skeletonContent : loadedContent}
    </Card>
  );
};

export default DriveStatsPanel;
