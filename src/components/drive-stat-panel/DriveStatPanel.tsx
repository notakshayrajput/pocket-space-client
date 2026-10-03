import { useEffect, useState } from "react";
import { Alert, Card, Descriptions, Progress, Skeleton, Typography } from "antd";
import SpaceService from "../../services/space-service";
import type { DriveStats } from "../../types";
import { formatBytes } from "../../services/util";

export default function DriveStatsPanel() {
  const [stats, setStats] = useState<DriveStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    SpaceService.getDriveStats().then(setStats)
      .catch(failure => setError(failure instanceof Error ? failure.message : "Could not load storage usage."));
  }, []);

  if (error) return <Alert type="error" showIcon message={error} />;
  return <Card title="Global storage" style={{ width: "100%", maxWidth: 640 }}>
    {!stats ? <Skeleton active /> : <>
      <Descriptions column={1} size="small">
        <Descriptions.Item label="Backend">{stats.backend === "S3" ? "AWS S3" : "File system"}</Descriptions.Item>
        <Descriptions.Item label="Stored data">{formatBytes(stats.globalUsedBytes)}</Descriptions.Item>
        <Descriptions.Item label="Global limit">{stats.globalLimitBytes === null ? "No app limit" : formatBytes(stats.globalLimitBytes)}</Descriptions.Item>
        {stats.backend === "FileSystem" && <>
          <Descriptions.Item label="Disk capacity">{formatBytes(stats.totalSpace)}</Descriptions.Item>
          <Descriptions.Item label="Disk available">{formatBytes(stats.availableSpace)}</Descriptions.Item>
        </>}
      </Descriptions>
      {stats.globalLimitBytes !== null && <div style={{ marginTop: 16 }}>
        <Typography.Text type="secondary">{formatBytes(Math.max(0, stats.globalLimitBytes - stats.globalUsedBytes))} available under the app limit</Typography.Text>
        <Progress percent={Math.min(100, Math.round(stats.globalUsedBytes / stats.globalLimitBytes * 100))}
          status={stats.globalUsedBytes >= stats.globalLimitBytes ? "exception" : "normal"} />
      </div>}
    </>}
  </Card>;
}
