import { useCallback, useEffect, useState } from "react";
import { Alert, Button, Flex, InputNumber, Modal, Space, Table, Tag, Typography } from "antd";
import { Navigate } from "react-router-dom";
import AppLayout from "../../layouts/app-layout/AppLayout";
import { TableSkeleton } from "../../components/loading/LoadingSkeletons";
import { useAuth } from "../../auth/auth-context";
import HttpService from "../../services/http-service";
import { formatBytes } from "../../services/util";

const MB = 1024 * 1024;
const MAX_QUOTA_MB = Math.floor(Number.MAX_SAFE_INTEGER / MB);
interface Account { id: string; username: string; status: string; quotaBytes: number; isBlocked: boolean; isAdmin: boolean }

export default function UserQuotas() {
  const { user } = useAuth();
  const isAdmin = user?.roles.includes("Admin");
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Account | null>(null);
  const [quotaMb, setQuotaMb] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [blockTarget, setBlockTarget] = useState<Account | null>(null);
  const [blockSaving, setBlockSaving] = useState(false);
  const [blockError, setBlockError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!isAdmin) return;
    setLoading(true);
    setError(null);
    try { setAccounts(await HttpService.getInstance().get<Account[]>("/admin/users")); }
    catch (failure) { setError(failure instanceof Error ? failure.message : "Could not load accounts."); }
    finally { setLoading(false); }
  }, [isAdmin]);
  useEffect(() => { void load(); }, [load]);
  if (!isAdmin) return <Navigate to="/" replace />;

  const save = async () => {
    if (!selected || quotaMb === null) return;
    setSaving(true);
    setSaveError(null);
    try {
      await HttpService.getInstance().put<void>(`/admin/users/${selected.id}/quota`, { quotaBytes: quotaMb * MB });
      setSelected(null);
      await load();
    } catch (failure) { setSaveError(failure instanceof Error ? failure.message : "Could not increase quota."); }
    finally { setSaving(false); }
  };

  const saveBlocked = async () => {
    if (!blockTarget) return;
    setBlockSaving(true);
    setBlockError(null);
    try {
      await HttpService.getInstance().put<void>(`/admin/users/${blockTarget.id}/block`, { isBlocked: !blockTarget.isBlocked });
      setBlockTarget(null);
      await load();
    } catch (failure) { setBlockError(failure instanceof Error ? failure.message : "Could not update this account."); }
    finally { setBlockSaving(false); }
  };

  return <AppLayout>
    <Flex justify="space-between" align="center" gap={12}>
      <Typography.Title level={2}>Manage users</Typography.Title>
      <Button onClick={() => void load()} disabled={loading}>Refresh</Button>
    </Flex>
    <Typography.Paragraph type="secondary">Increase a user's storage quota, or block access to their account. Blocking keeps their files and can be reversed.</Typography.Paragraph>
    {error && <Alert type="error" showIcon message={error} />}
    {loading ? <TableSkeleton columns={4} label="Loading users" /> : <Table rowKey="id" dataSource={accounts} scroll={{ x: 650 }} columns={[
      { title: "Username", dataIndex: "username" },
      { title: "Status", key: "status", render: (_, account) => <Space><span>{account.status}</span>{account.isBlocked && <Tag color="red">Blocked</Tag>}</Space> },
      { title: "Quota", dataIndex: "quotaBytes", render: (value: number) => formatBytes(value) },
      { title: "Action", key: "action", render: (_, account) => <Space>
        <Button disabled={account.isBlocked || account.quotaBytes >= MAX_QUOTA_MB * MB} onClick={() => {
          setSelected(account); setQuotaMb(Math.min(MAX_QUOTA_MB, account.quotaBytes / MB + 100)); setSaveError(null);
        }}>Increase quota</Button>
        <Button danger={!account.isBlocked} disabled={account.isAdmin || account.id === user?.id} onClick={() => {
          setBlockTarget(account); setBlockError(null);
        }}>{account.isBlocked ? "Unblock" : "Block"}</Button>
      </Space> },
    ]} />}
    <Modal title={`Increase quota for ${selected?.username ?? "user"}`} open={selected !== null}
      onCancel={() => setSelected(null)} onOk={() => void save()} confirmLoading={saving}
      okButtonProps={{ disabled: quotaMb === null || quotaMb <= (selected?.quotaBytes ?? 0) / MB }}>
      {saveError && <Alert type="error" showIcon message={saveError} style={{ marginBottom: 16 }} />}
      <Typography.Paragraph>Current quota: {formatBytes(selected?.quotaBytes ?? 0)}</Typography.Paragraph>
      <InputNumber aria-label="New quota in MB" min={(selected?.quotaBytes ?? 0) / MB + 1}
        max={MAX_QUOTA_MB} precision={0} value={quotaMb} onChange={setQuotaMb} addonAfter="MB" style={{ width: "100%" }} />
    </Modal>
    <Modal title={`${blockTarget?.isBlocked ? "Unblock" : "Block"} ${blockTarget?.username ?? "user"}?`}
      open={blockTarget !== null} onCancel={() => setBlockTarget(null)}
      onOk={() => void saveBlocked()} confirmLoading={blockSaving}
      okText={blockTarget?.isBlocked ? "Unblock user" : "Block user"}
      okButtonProps={{ danger: !blockTarget?.isBlocked }}>
      {blockError && <Alert type="error" showIcon message={blockError} style={{ marginBottom: 16 }} />}
      <Typography.Paragraph>{blockTarget?.isBlocked
        ? "This user will be able to sign in again if their account is still active."
        : "This user will lose access immediately. Their files will be kept."}</Typography.Paragraph>
    </Modal>
  </AppLayout>;
}
