import React from "react";
import { Typography } from "antd";
import AppLayout from "../../layouts/app-layout/AppLayout";
import DriveStatsPanel from "../../components/drive-stat-panel/DriveStatPanel";
import UserQuotaPanel from "../../components/user-quota-panel/UserQuotaPanel";
import { useAuth } from "../../auth/auth-context";

const StorageInfo: React.FC = () => {
  const { user } = useAuth();
  return (
  <AppLayout>
    <Typography.Title level={2} style={{ marginTop: 0 }}>Storage Info</Typography.Title>
    <Typography.Paragraph type="secondary">Your storage quota and current usage.</Typography.Paragraph>
    <UserQuotaPanel />
    {user?.roles.includes("Admin") && <div style={{ marginTop: 24 }}><DriveStatsPanel /></div>}
  </AppLayout>
);
};

export default StorageInfo;
