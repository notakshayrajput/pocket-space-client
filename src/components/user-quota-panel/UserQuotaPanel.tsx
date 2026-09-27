import { useEffect, useState } from "react";
import { Alert, Card, Progress, Skeleton, Space, Typography } from "antd";
import SpaceService from "../../services/space-service";
import { formatBytes } from "../../services/util";
import type { DriveStats } from "../../types";

export default function UserQuotaPanel() {
  const [stats, setStats] = useState<DriveStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    SpaceService.getDriveStats().then(setStats)
      .catch(failure => setError(failure instanceof Error ? failure.message : "Could not load storage usage."));
  }, []);

  if (error) return <Alert type="error" showIcon message={error} />;
  return <Card title="Your storage" style={{ width: "100%", maxWidth: 640 }}>
    {!stats ? <Skeleton active /> : <Space direction="vertical" style={{ width: "100%" }}>
      <Typography.Text strong>{formatBytes(stats.occupiedSpace)} used of {formatBytes(stats.quotaBytes)}</Typography.Text>
      <Progress percent={Math.min(100, Math.round(stats.occupiedSpace / stats.quotaBytes * 100))}
        status={stats.occupiedSpace >= stats.quotaBytes ? "exception" : "normal"} />
      <Typography.Text type="secondary">
        {formatBytes(Math.max(0, stats.quotaBytes - stats.occupiedSpace))} available. Files in Trash count until permanently removed.
      </Typography.Text>
    </Space>}
  </Card>;
}
