import { useCallback, useEffect, useState } from "react";
import { Alert, App, Button, Flex, Table, Typography } from "antd";
import { Navigate } from "react-router-dom";
import AppLayout from "../../layouts/app-layout/AppLayout";
import { useAuth } from "../../auth/auth-context";
import HttpService from "../../services/http-service";

interface PendingUser { id: string; username: string; createdAt: string; pendingExpiresAt: string }

export default function PendingUsers() {
  const { user } = useAuth();
  const isAdmin = user?.roles.includes("Admin");
  const [users, setUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [approving, setApproving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { message } = App.useApp();
  const load = useCallback(async () => {
    if (!isAdmin) return;
    setLoading(true);
    setError(null);
    try { setUsers(await HttpService.getInstance().get<PendingUser[]>("/admin/users/pending")); }
    catch (failure) { setError(failure instanceof Error ? failure.message : "Could not load pending accounts."); }
    finally { setLoading(false); }
  }, [isAdmin]);
  useEffect(() => { void load(); }, [load]);
  if (!isAdmin) return <Navigate to="/" replace />;

  const approve = async (account: PendingUser) => {
    setApproving(account.id);
    try {
      await HttpService.getInstance().post<void>(`/admin/users/${account.id}/approve`, {});
      message.success(`${account.username} is approved. Their files will be kept.`);
      await load();
    } catch (failure) { message.error(failure instanceof Error ? failure.message : "Approval failed."); }
    finally { setApproving(null); }
  };

  return <AppLayout>
    <Flex justify="space-between" align="center" gap={12}>
      <Typography.Title level={2}>Account approvals</Typography.Title>
      <Button onClick={() => void load()} loading={loading}>Refresh</Button>
    </Flex>
    <Typography.Paragraph type="secondary">Approve accounts before their deadline to keep their access and files. Unapproved accounts are automatically deleted after 7 days.</Typography.Paragraph>
    {error && <Alert type="error" message={error} showIcon />}
    <Table rowKey="id" dataSource={users} loading={loading} scroll={{ x: 650 }} locale={{ emptyText: "No accounts are waiting for approval." }} columns={[
      { title: "Username", dataIndex: "username" },
      { title: "Signed up", dataIndex: "createdAt", render: (value: string) => new Date(value).toLocaleString() },
      { title: "Deletion deadline", dataIndex: "pendingExpiresAt", render: (value: string) => new Date(value).toLocaleString() },
      { title: "Action", key: "action", render: (_, account) => <Button type="primary" disabled={approving !== null && approving !== account.id}
        loading={approving === account.id} onClick={() => void approve(account)}>Approve</Button> },
    ]} />
  </AppLayout>;
}
