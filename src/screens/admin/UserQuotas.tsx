import { useCallback, useEffect, useState } from "react";
import { Alert, Button, Flex, InputNumber, Modal, Table, Typography } from "antd";
import { Navigate } from "react-router-dom";
import AppLayout from "../../layouts/app-layout/AppLayout";
import { useAuth } from "../../auth/auth-context";
import HttpService from "../../services/http-service";
import { formatBytes } from "../../services/util";

const MB = 1024 * 1024;
const MAX_QUOTA_MB = Math.floor(Number.MAX_SAFE_INTEGER / MB);
interface Account { id: string; username: string; status: string; quotaBytes: number }

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

  return <AppLayout>
    <Flex justify="space-between" align="center" gap={12}>
      <Typography.Title level={2}>User quotas</Typography.Title>
      <Button onClick={() => void load()} loading={loading}>Refresh</Button>
    </Flex>
    <Typography.Paragraph type="secondary">Every account starts with 500 MB. Increase a quota when a user needs more space.</Typography.Paragraph>
    {error && <Alert type="error" showIcon message={error} />}
    <Table rowKey="id" dataSource={accounts} loading={loading} scroll={{ x: 650 }} columns={[
      { title: "Username", dataIndex: "username" },
      { title: "Status", dataIndex: "status" },
      { title: "Quota", dataIndex: "quotaBytes", render: (value: number) => formatBytes(value) },
      { title: "Action", key: "action", render: (_, account) => <Button
        disabled={account.quotaBytes >= MAX_QUOTA_MB * MB} onClick={() => {
        setSelected(account); setQuotaMb(Math.min(MAX_QUOTA_MB, account.quotaBytes / MB + 100)); setSaveError(null);
      }}>Increase quota</Button> },
    ]} />
    <Modal title={`Increase quota for ${selected?.username ?? "user"}`} open={selected !== null}
      onCancel={() => setSelected(null)} onOk={() => void save()} confirmLoading={saving}
      okButtonProps={{ disabled: quotaMb === null || quotaMb <= (selected?.quotaBytes ?? 0) / MB }}>
      {saveError && <Alert type="error" showIcon message={saveError} style={{ marginBottom: 16 }} />}
      <Typography.Paragraph>Current quota: {formatBytes(selected?.quotaBytes ?? 0)}</Typography.Paragraph>
      <InputNumber aria-label="New quota in MB" min={(selected?.quotaBytes ?? 0) / MB + 1}
        max={MAX_QUOTA_MB} precision={0} value={quotaMb} onChange={setQuotaMb} addonAfter="MB" style={{ width: "100%" }} />
    </Modal>
  </AppLayout>;
}
